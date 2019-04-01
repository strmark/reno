var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');

// Use body parser to parse JSON body
app.use(bodyParser.json());

// Http Method: GET
// URI        : /user_profiles
// Read all the user profiles
app.get('/employees', function (req, res) {
    "use strict";


    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM EMPLOYEES", {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error getting the employee",
                    detailed_message: err.message
                }));
            } else {
                res.contentType('application/json').status(200);
                res.set('Access-Control-Allow-Origin' , '*');
                res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.send(JSON.stringify(result.rows));
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /employees : Connection released");
                    }
                });
        });
    });
});

// Http method: GET
// URI        : /userprofiles/:USER_NAME
// Read the profile of user given in :USER_NAME
app.get('/employees/:EMPLOYEE_ID', function (req, res) {
    "use strict";

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.set('Access-Control-Allow-Origin' , '*');
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM EMPLOYEES WHERE EMPLOYEE_ID = :EMPLOYEE_ID", [req.params.EMPLOYEE_ID], {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err || result.rows.length < 1) {
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the user profile" : "Employee doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                res.set('Access-Control-Allow-Origin' , '*');
                res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /employees/" + req.params.EMPLOYEE_ID + " : Connection released");
                    }
                });
        });
    });
});

// Http method: POST
// URI        : /user_profiles
// Creates a new user profile
app.post('/employees', function (req, res) {
    "use strict";
    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }
    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute("INSERT INTO employees VALUES " +
                "(:EMPLOYEE_ID, :FIRST_NAME,:LAST_NAME, :EMAIL, "+
                ":PHONE_NUMBER, :HIRE_DATE, :JOB_ID, :SALARY, :COMMISSION_PCT, "+
                ":MANAGER_ID, :DEPARTMENT_ID) " , [req.body.EMPLOYEE_ID, req.body.FIRST_NAME, req.body.LAST_NAME
                ,req.body.EMAIL, req.body.PHONE_NUMBER, req.body.HIRE_DATE, req.body.JOB_ID, req.body.SALARY
                ,req.body.COMMISSION_PCT, req.body.MANAGER_ID, req.body.DEPARTMENT_ID], {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "Employee already exists" : "Input Error",
                        detailed_message: err.message
                    }));
                } else {
                    // Successfully created the resource
                    res.status(201).set('Location', '/employees/' + req.body.USER_NAME).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /employees : Connection released");
                        }
                    });
            });
    });
});

// Build UPDATE statement and prepare bind variables
var buildUpdateStatement = function buildUpdateStatement(req) {
    "use strict";

    var statement = "",
        bindValues = {};
			
    if (req.body.EMPLOYEE_ID) {
        statement += "EMPLOYEE_ID = :EMPLOYEE_ID";
        bindValues.EMPLOYEE_ID = req.body.EMPLOYEE_ID;
    }
    if (req.body.FIRST_NAME) {
        if (statement) statement = statement + ", ";
        statement += "FIRST_NAME = :FIRST_NAME";
        bindValues.FIRST_NAME = req.body.FIRST_NAME;
    }
    if (req.body.LAST_NAME) {
        if (statement) statement = statement + ", ";
        statement += "LAST_NAME = :LAST_NAME";
        bindValues.EMAIL = req.body.EMAIL;
    }
    if (req.body.EMAIL) {
        if (statement) statement = statement + ", ";
        statement += "EMAIL = :EMAIL";
        bindValues.EMAIL = req.body.EMAIL;
    }
    if (req.body.PHONE_NUMBER) {
        if (statement) statement = statement + ", ";
        statement += "PHONE_NUMBER = :PHONE_NUMBER";
        bindValues.PHONE_NUMBER = req.body.PHONE_NUMBER;
    }
    if (req.body.HIRE_DATE) {
        if (statement) statement = statement + ", ";
        statement += "HIRE_DATE = :HIRE_DATE";
        bindValues.HIRE_DATE = req.body.HIRE_DATE;
    }
    if (req.body.JOB_ID) {
        if (statement) statement = statement + ", ";
        statement += "JOB_ID = :JOB_ID";
        bindValues.JOB_ID = req.body.JOB_ID;
    }
    if (req.body.SALARY) {
        if (statement) statement = statement + ", ";
        statement += "SALARY = :SALARY";
        bindValues.SALARY = req.body.SALARY;
    }
    if (req.body.COMMISSION_PCT) {
        if (statement) statement = statement + ", ";
        statement += "COMMISSION_PCT = :COMMISSION_PCT";
        bindValues.COMMISSION_PCT = req.body.COMMISSION_PCT;
    }
	if (req.body.MANAGER_ID) {
        if (statement) statement = statement + ", ";
        statement += "MANAGER_ID = :MANAGER_ID";
        bindValues.MANAGER_ID = req.body.MANAGER_ID;
    }
	if (req.body.DEPARTMENT_ID) {
        if (statement) statement = statement + ", ";
        statement += "DEPARTMENT_ID = :DEPARTMENT_ID";
        bindValues.DEPARTMENT_ID = req.body.DEPARTMENT_ID;
    }	
    statement += " WHERE EMPLOYEE_ID = :EMPLOYEE_ID";
    bindValues.USER_NAME = req.params.USER_NAME;
    statement = "UPDATE EMPLOYEES SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};

// Http method: PUT
// URI        : /user_profiles/:USER_NAME
// Update the profile of user given in :USER_NAME
app.put('/employees/:EMPLOYEE_ID', function (req, res) {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatement = buildUpdateStatement(req);
        connection.execute(updateStatement.statement, updateStatement.bindValues, {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err ? "Input Error" : "User doesn't exist",
                        detailed_message: err ? err.message : ""
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.status(204).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("PUT /user_profiles/" + req.params.USER_NAME + " : Connection released ");
                        }
                    });
            });
    });
});

// Http method: DELETE
// URI        : /userprofiles/:USER_NAME
// Delete the profile of user given in :USER_NAME
app.delete('/employees/:EMPLOYEE_ID', function (req, res) {
    "use strict";

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("DELETE FROM EMPLOYEES WHERE EMPLOYEE_ID = :EMPLOYEE_ID", [req.params.EMPLOYEE_ID], {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, function (err, result) {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "Input Error" : "Employee doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                // Resource successfully deleted. Sending an empty response body. 
                res.status(204).end();
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("DELETE /employees/" + req.params.USER_NAME + " : Connection released");
                    }
                });

        });
    });
});

var server = app.listen(3000, function () {
    "use strict";

    var host = server.address().address,
        port = server.address().port;

    console.log(' Server is listening at http://%s:%s', host, port);
});
