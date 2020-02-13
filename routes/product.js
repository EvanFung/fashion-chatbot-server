'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var Todo = AV.Object.extend('Todo');
const CARD_RESPONSE = 'CARD_RESPONSE';
const { google } = require('googleapis');
const customsearch = google.customsearch('v1');
const dotenv = require('dotenv');
dotenv.config();



router.get('/', async function (req, res, next) {
    // let result = await customsearch.cse.list({
    //     auth: process.env.GG_API_KEY || 'AIzaSyCBvTkZGVTINr4wI3MHrTw7yQnsRzCvq1Q',
    //     cx: '004826975735948944979:1rgd4xgj0pl',
    //     q: "Evan",
    // });
    // result = result.data;
    // console.log(process.env.GG_API_KEY);
    // const { queries, items, searchInformation } = result;
    // console.log(items[0].link);
    // console.log(items[0].title);
    // console.log(items[0].snippet);
    // console.log(queries);
    // console.log(searchInformation);
    console.log(Math.floor(Math.random() * 5));
    res.json({
        hello: 'world'

    });
});

router.post('/', async function (req, res, next) {
    const action = req.body.queryResult.action;
    const productParam = req.body.queryResult.parameters.product;
    let fulfillmentResponse;
    if (action === 'product.search' && productParam != null) {
        let productCategory = req.body.queryResult.parameters.product;
        console.log(productCategory);
        fulfillmentResponse = await handleProductSearch(req.body.queryResult);
        console.log(fulfillmentResponse);
        res.send(fulfillmentResponse);
    } else {
        res.send(createResponseText(`I don't know what is it..I am so stupid`));
    }
});


async function handleProductSearch(queryResult) {
    let productCategory = queryResult.parameters.product;
    //list of treding products.
    let products;
    if (productCategory != null) {
        products = await getTredingProduct(productCategory);
        if (products.length > 0) {
            //get the random item
            let randomIndex = random();
            let title = products[randomIndex].get('title');
            let amazonResult = await getAmazonGoogleSearchResult(title);
            let eBayResult = await getEBayGoogleSearchResult(title);
            console.log(amazonResult.link);
            return createResponseCard(title, products, {
                "amazon": amazonResult.link,
                "ebay": eBayResult.link,
            }, randomIndex);
        } else {
            return createResponseText('Opzz.. No such a product');
        }
    }
    return createSimpleResponse('Opzz.. No such a product');
}

async function getTredingProduct(category) {
    let query = new AV.Query('Product');
    query.addDescending('numOfRating');
    query.addDescending('rating');
    query.equalTo('subCategory', category);
    query.limit(5);
    return await query.find();
}

function random() {
    return Math.floor(Math.random() * 5);
}

function createResponseCard(textResponse, products, google, index) {
    let response;
    response = {
        "fulfillmentText": textResponse,
        "fulfillmentMessages": [
            {
                "text": {
                    "text": [
                        "Hey, this fashion item may be your best choice! Let's checkout!"
                    ]
                }
            },
            {
                "basic_card": {
                    "title": products != null ? products[index].get('title') : null,
                    "subtitle": products != null ? products[index].get('description') : null,
                    "formatted_text": products != null ? products[index].get('description') : null,
                    "image": {
                        "image_uri": products != null ? products[index].get('imageUrl') : null
                    },
                    "buttons": [
                        {
                            "title": "AMAZON",
                            "open_uri_action": {
                                "uri": google.amazon
                            }
                        },
                        {
                            "title": "eBay",
                            "open_uri_action": {
                                "uri": google.ebay
                            }
                        },
                    ]
                }
            }
        ],
        "source": "example.com",
        "payload": {
            "products": {
                products
            }
        }
    }

    return response;
}

function createResponseText(textResponse) {
    let response = {
        "fulfillmentText": textResponse,
        "fulfillmentMessages": [
            {
                "text": {
                    "text": [
                        textResponse
                    ]
                },
            },
        ],
        "source": "example.com",
        "payload": {
        }
    };
    return response;
}


async function getAmazonGoogleSearchResult(query) {
    let result = await customsearch.cse.list({
        auth: process.env.GG_API_KEY || 'AIzaSyCBvTkZGVTINr4wI3MHrTw7yQnsRzCvq1Q',
        cx: process.env.GG_CX_AMAZON || '004826975735948944979:1rgd4xgj0pl',
        q: query,
    });
    result = result.data;
    const { queries, items, searchInformation } = result;
    console.log(items[0].link);
    console.log(items[0].title);
    console.log(items[0].snippet);

    return {
        "title": items[0].title,
        "link": items[0].link,
        "snippet": items[0].snippet,
    };
}

async function getEBayGoogleSearchResult(query) {
    let result = await customsearch.cse.list({
        auth: process.env.GG_API_KEY || 'AIzaSyCBvTkZGVTINr4wI3MHrTw7yQnsRzCvq1Q',
        cx: process.env.GG_CX_EBAY || '004826975735948944979:alhvueteiuc',
        q: query,
    });
    result = result.data;
    const { queries, items, searchInformation } = result;
    console.log(items[0].link);
    console.log(items[0].title);
    console.log(items[0].snippet);
    return {
        "title": items[0].title,
        "link": items[0].link,
        "snippet": items[0].snippet,
    };
}

module.exports = router;
