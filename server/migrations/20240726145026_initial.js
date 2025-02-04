/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id');
      table.integer('wid').unique().notNullable();
      table.string('eid', 20).unique().notNullable();
      table.string('first_name');
      table.string('last_name');
      table.string('email').unique().notNullable();
      table.string('refresh_token', 255);
      table.boolean('warning').defaultTo(false);
      table.boolean('profile_updated').defaultTo(false);
      table.timestamp('updated_at').nullable();
      table.string('updated_by').nullable();
    })
    .createTable('user_discord', function(table) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').primary();
      table.string('discord_id').notNullable();
      table.string('username', 255).notNullable();
    })
    .createTable('user_github', function(table) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').primary();
      table.string('github_id').notNullable();
      table.string('username', 255).notNullable();
      table.string('profile_url', 255).notNullable();
    })
    .createTable('programs', function(table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.string('plan').notNullable();
      table.string('subplan');
    })
    .createTable('user_program', function(table) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('program_id').unsigned().references('id').inTable('programs');
      table.primary(['user_id','program_id']);
      table.string('assigned_advisor');
      table.boolean('graduated');
      table.boolean('withdrew');
      table.boolean('dismissed');
      table.float('program_gpa');
      table.string('classification');
      table.string('graduation_date');
      table.boolean('on_warning');
    })
    .createTable('roles', function(table) {
      table.increments('id');
      table.string('name').unique().notNullable();
    })
    .createTable('user_roles', function(table) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['user_id','role_id']);
    })
    .createTable('professional_program_applications', function(table) {
      table.increments('id');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('semester').notNullable();
      table.string('status').notNullable();
      table.string('notes');
      table.boolean('waiver');
      table.timestamps();
      table.string('created_by', 20);
      table.string('updated_by', 20);
    })
    .createTable('courses', function(table){
      table.increments('id');
      table.integer('class_number').notNullable();
      table.integer('term').notNullable();
      table.string('subject').notNullable();
      table.string('catalog').notNullable();
      table.string('name').notNullable();
      table.string('section').notNullable();
      table.string('component').notNullable();
      table.string('instructor').notNullable();
      table.integer('credit_hours');
    })
    .createTable('user_courses', function(table) {
      table.integer('course_id').unsigned().references('id').inTable('courses').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.primary(['course_id','user_id']);
      table.string('grade');
      table.boolean('ignore_in_gpa').defaultTo(false);
      table.boolean('dropped').defaultTo(false);
      table.string('dropped_date');
      table.string('last_attendence');
      table.string('midterm_grade');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('user_courses')
    .dropTable('courses')
    .dropTable('professional_program_applications')
    .dropTable('user_roles')
    .dropTable('roles')
    .dropTable('user_program')
    .dropTable('programs')
    .dropTable('users');
};
