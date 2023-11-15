const chai = require('chai');
const expect = chai.expect;
const processApplication = require('/workspaces/Capstone/server/endpoints/disabled/disable');

describe('Test show-application route', () => {
    it('should return "Hello disable"', () => {
        const req = {};
        const res = {
            send: function (message) {
                this.message = message;
            }
        };

        processApplication(req, res);
        const actualResult = res.message;
        const expectedResult = 'Hello disable';
        expect(actualResult).to.equal(expectedResult);
    });
});
