const Model = require('./base.js')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const logger = require('../configs/logger.js')
const objection = require('objection')
//const nanoid = require('nanoid')

// Related Models
const Role = require('./role.js')

//Random function for WID testing for now
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: autogenerated id
 *         email:
 *           type: email
 *           description: Email address of the user
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 *       example:
 *           id: 1
 *           email: test-admin
 *           name: Test Administrator
 *           roles:
 *             - id: 1
 *               name: admin
 *
 */

class User extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'users'
  }

  // Each model must have a column (or a set of columns) that uniquely
  // identifies the rows. The column(s) can be specified using the `idColumn`
  // property. `idColumn` returns `id` by default and doesn't need to be
  // specified unless the model's primary key is something else.
  static get idColumn() {
    return 'id'
  }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.
  //fullName() {
  //  return this.firstName + ' ' + this.lastName;
  //}
  static async findOrCreate(email) {
    let user = await User.query().where('email', email).limit(1)
    // user not found - create user
    if (user.length === 0) {
      let admin = false
      if (process.env.NODE_ENV !== 'production' && email === "admin@ksu.edu") {
          admin = true
      }
      user = [
        await User.query().insert({
          email: email,
          eid: email,
          wid: getRandomInt(1000000000),
          first_name: email,
          last_name: email,
          is_admin: admin,
          profile_updated: false
        }),
      ]
      if(process.env.NODE_ENV !== 'production'){
        console.log("NOT IN PRODUCTION, SETTING USER ROLE TO API")
        const defaultRoleId = 1;  // Assuming the default role has id 1

        // Insert into the user_roles table
        await User.relatedQuery('roles') 
          .for(user[0].id) 
          .relate(defaultRoleId);
      }
      logger.info('User ' + email + ' created')
    }
    return user[0]
  }

  // static async findByRefreshToken(token) {
  //   let user = await User.query().where('refresh_token', token).limit(1)
  //   if (user.length === 0) {
  //     return null
  //   }
  //   return user[0]
  // }

  async updateRefreshToken() {
    var token = this.refresh_token
    if (!token) {
      token = crypto.randomBytes(32).toString('hex')
      await this.$query().patch({
        refresh_token: token,
      })
    }
    const refresh_token = jwt.sign(
      {
        user_id: this.id,
        refresh_token: token,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: '6h',
      }
    )
    return refresh_token
  }

  async get_admin() {
    const roles = await this.$relatedQuery('roles').for(this.id).select('name')
    //Roles for current user
    //console.log(roles)
    return roles.some((r) => r.name === 'admin')
  }

  async is_api() {
    const roles = await this.$relatedQuery('roles').for(this.id).select('name')
    //Roles for current user
    //console.log(roles)
    return roles.some((r) => r.name === 'api')
  }

  static async getToken(id) {
    let user = await User.query().findById(id)
    // tokens are currently only for users with 'api' or 'admin' roles
    // should change this to pass role information in the token, and attach middleware to the api routes that should be admin only
    const is_api = await user.is_api()
    const is_admin = await user.get_admin()
    if (is_api || is_admin) {
    //Can pass role information in the token here,
    //then use middleware like admin-required to check roles when accessing a route.
      const token = jwt.sign(
        {
          user_id: id,
          email: user.email,
          is_admin: is_admin,
          is_api: is_api,
          //refresh_token: refresh_token,
          profile_updated: user.profile_updated
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: '30m',
        }
      )
      return token
    } else {
      logger.info(
        'User ' +
          user.email +
          ' does not have an api or admin role but requested a token'
      )
      return null
    }
  }

  static async clearRefreshToken(id) {
    await User.query().findById(id).patch({
      refresh_token: null,
    })
  }

  // Optional JSON schema. This is not the database schema!
  // No tables or columns are generated based on this. This is only
  // used for input validation. Whenever a model instance is created
  // either explicitly or implicitly it is checked against this schema.
  // See http://json-schema.org/ for more info.
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email'],

      properties: {
        email: { type: 'string', format: 'email' },
      },
    }
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'users.id',
          // ManyToMany relation needs the `through` object
          // to describe the join table.
          through: {
            // If you have a model class for the join table
            // you need to specify it like this:
            // modelClass: PersonMovie,
            from: 'user_roles.user_id',
            to: 'user_roles.role_id',
          },
          to: 'roles.id',
        },
        filter: (builder) => builder.select('id'),
      },
    }
  }

  async $beforeInsert() {
    //this.slug = nanoid()
    let user = await User.query().where('email', this.email).limit(1)
    // user not found - create user
    if (user.length !== 0) {
      throw new objection.ValidationError({
        message: 'email should be unique',
        type: 'ModelValidation',
        data: {
          email: [
            {
              message: 'this email is already in use',
            },
          ],
        },
      })
    }
  }
}

module.exports = User