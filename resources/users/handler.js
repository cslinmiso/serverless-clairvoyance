'use strict';

const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const fetch = require('node-fetch')

function display(object) {
    return JSON.stringify(object, null, 2)
}

function getUserDataUri(access_token, fileds) {
    return `https://graph.facebook.com/me?access_token=${access_token}&fileds=email,id,name`
}

module.exports.handler = (event, context) => {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const url = getUserDataUri(event.access_token)
    const operation = event.operation
    switch (event.operation) {
        case 'get':
            fetch(url, {
                    mode: 'cors'
                })
                .then(response => response.json())
                .then(user => {
                    event.payload.ExpressionAttributeValues[':fb_id'] = user.id
                    dynamo.query(event.payload, (err, data) => {
                        if (err) {
                            context.fail(err)
                        } else {
                            context.succeed(data.Items)
                        }
                    })
                })
            break
        case 'create':

            fetch(url, {
                    mode: 'cors'
                })
                .then(response => response.json())
                .then(user => {
                    console.log('User: ', display(user));
                    const uuid = require('node-uuid')
                    event.payload.Item.id = uuid.v1()
                    event.payload.Item.fb_id = user.id
                    event.payload.Item.user_name = user.name

                    dynamo.putItem(event.payload, (err, data) => {
                        if (err) {
                            context.fail(new Error(err))
                        } else {
                            context.succeed(event.payload.Item)
                        }
                    })
                })
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
            break
    }
}