'use strict';
const { Router } = require('express')
var AV = require('leanengine');
const { google } = require('googleapis');
const { WebhookClient, Text, Card, Image, Suggestion, Payload } = require('dialogflow-fulfillment');
const customsearch = google.customsearch('v1');
const { men_map, women_map, kid_map } = require('../category');
const dotenv = require('dotenv');
dotenv.config();
const router = module.exports = new Router



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
    res.json({
        hello: 'world'
    });
});

router.post('/', async function (req, res, next) {
    const agent = new WebhookClient({ request: req, response: res });
    let page = 0;
    // agent.requestSource = 'PLATFORM_UNSPECIFIED';

    async function productSearch(agent) {
        let missingSlots = [];
        const [color, brand, category, gender] = [agent.parameters['product_color'], agent.parameters['product_brand'], agent.parameters['product_category'], agent.parameters['user_gender']];
        if (!color) { missingSlots.push('color'); }
        if (!brand) { missingSlots.push('brand'); }
        if (!category) { missingSlots.push('category'); }
        if (!gender) { missingSlots.push('gender') }
        if (missingSlots.length === 1) {
            //Ask brand
            agent.add(`Looks like you didn't provide a ${missingSlots[0]} for the product`);
        } else if (missingSlots.length === 2) {
            //Ask color
            agent.add(`Looks like you didn't provide a ${missingSlots[0]} and ${missingSlots[1]}`);
        } else if (missingSlots.length === 3) {
            //Ask category
            agent.add(`Looks like you didn't provide a ${missingSlots[0]}, ${missingSlots[1]} and ${missingSlots[2]}`);
            if (gender == 'Male') {
                men_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            } else if (gender == 'Female') {
                women_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            } else {
                kid_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            }
        } else if (missingSlots.length === 4) {
            //Ask gender
            agent.add(`Halo, Can you provide some informations about the product? Gender, Color, Brand and Category are required.`);
            agent.add(`Looks like you didn't provide a ${missingSlots[0]}, ${missingSlots[1]} , ${missingSlots[2]} and ${missingSlots[3]}`);
            agent.add(`Firstly, Can you provide the product gender? Thanks`);
            agent.add(new Suggestion(`Male`));
            agent.add(new Suggestion(`Female`));
            agent.add(new Suggestion(`Kid`));
        } else {
            console.log(`${color} ${brand} ${category} ${gender}`);
            let category_map;
            if (gender == 'Male') {
                category_map = men_map;
            } else if (gender == 'Female') {
                category_map = women_map;
            }
            else {
                category_map = kid_map;
            }
            //User fill out all fields
            let query = new AV.Query('Product2');
            query.contains('categories', category_map.get(category));
            query.equalTo('color_family', color);
            query.equalTo('brand', brand);
            query.addDescending('rating');
            query.limit(5);
            let products = await query.find();
            products.forEach(function (product, index) {
                let card = new Card(product.get('title'));
                if (product.get('image_url_').length > 0 && product.get('product_url') !== undefined) {
                    card.setImage(product.get('image_url_')[0].url);
                    card.setButton({ 'text': 'Detail', 'url': product.get('product_url') });
                    card.setText(`size system brand: ${product.get('sizesystembrand')} \n color: ${product.get('color_family')}`);
                    agent.add(card);
                } else {
                    agent.add(`Sorry, this product has unexpected error, cannot show you...try again later`);

                }
            });
        }

    }


    function welcome(agent) {
        page = 0;
        var possibleResponse1 = [
            `Hey! I'm Fashion Chatbot, your AI stylist. I can recommend you clothes and outfits selected just for you. What are you looking for today?`,
            `Hi, What are you looking for today? May be I can recommend some clothes and outfits just for you.`,
            `Hi, what can I help you? I'm your recommender chatbot!`
        ];
        var possibleResponse2 = [
            `The fashion AI won't collect your personal data!! You can feel free to use it!`,
            `We won't collect your personal data. You can feel free to use it!`
        ];
        var pick1 = Math.floor(Math.random() * possibleResponse1.length);
        var pick2 = Math.floor(Math.random() * possibleResponse2.length);
        agent.add(possibleResponse1[pick1]);
        agent.add(possibleResponse2[pick2]);
        agent.add(new Suggestion(`Product search`));
        agent.add(new Suggestion(`Recommendation`));
        agent.add(new Suggestion(`Product Browse`));
    }


    function browseProduct(agent) {
        let missingSlots = [];
        var possibleResponse1 = [
            `Would you tell gender of the collections that you looking for?`,
            `Would you tell us gender of the product?`
        ];
        var possibleResponse2 = [
            `Here are our collections. Check it out!`,
            `There are many categories of products. Choose one that you like to continue.`
        ];
        var pick1 = Math.floor(Math.random() * possibleResponse1.length);
        var pick2 = Math.floor(Math.random() * possibleResponse2.length);

        const [gender] = [agent.parameters['product_gender']];
        if (!gender) { missingSlots.push('gender'); }
        if (missingSlots.length == 1) {
            agent.add(possibleResponse1[pick1]);
            agent.add(`Looks like you didn't provide a ${missingSlots[0]} for the product`);
            agent.add(new Suggestion(`Male`));
            agent.add(new Suggestion(`Female`));
            agent.add(new Suggestion(`Kid`));
        } else {
            agent.add(possibleResponse2[pick2]);
            if (gender == 'Male') {
                men_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            } else if (gender == 'Female') {
                women_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            } else {
                kid_map.forEach(function (value, key, map) {
                    agent.add(new Suggestion(`${key}`));
                });
            }
        }


    }


    async function browseProductSearch(agent) {
        let missingSlots = [];
        const [category] = [agent.parameters['product_category']];
        if (!category) { missingSlots.push(`category`); }
        if (missingSlots.length == 1) {
            agent.add(`Looks like you didn't provide a ${missingSlots[0]} for the product`);
        } else {
            let query = new AV.Query('Product2');
            let gender = agent.contexts[0].parameters['product_gender'];
            let category_map;
            if (gender == 'Male') {
                category_map = men_map;
            } else if (gender == 'Female') {
                category_map = women_map;
            }
            else {
                category_map = kid_map;
            }
            query.contains('categories', category_map.get(category));
            query.exists('image_url_');
            query.exists('product_url');
            query.limit(5);
            let products = await query.find();
            products.forEach(function (product, index) {
                let card = new Card(product.get('title'));
                if (product.get('image_url_').length > 0 && product.get('product_url') !== undefined) {
                    card.setImage(product.get('image_url_')[0].url);
                    card.setButton({ 'text': 'Detail', 'url': product.get('product_url') });
                    card.setText(`The product Size system brand: ${product.get('sizesystembrand')} \n color: ${product.get('color_family')}`);
                    agent.add(card);
                } else {
                    agent.add(`Sorry, this product has unexpected error, cannot show you...try again later`);
                }

            });
        }
    }


    async function browseProductSearchContinue(agent) {
        //we get the product_browse context parameters.
        let gender = agent.contexts[1].parameters['product_gender'];
        let category = agent.contexts[1].parameters['product_category'];

        let query = new AV.Query('Product2');
        let category_map;
        if (gender == 'Male') {
            category_map = men_map;
        } else if (gender == 'Female') {
            category_map = women_map;
        }
        else {
            category_map = kid_map;
        }
        page = page + 5;
        console.log(page);
        query.contains('categories', category_map.get(category));
        query.exists('image_url_');
        query.exists('product_url');
        query.skip(page);
        query.limit(5);
        let products = await query.find();
        products.forEach(function (product, index) {
            let card = new Card(product.get('title'));
            if (product.get('image_url_').length > 0 && product.get('product_url') !== undefined) {
                card.setImage(product.get('image_url_')[0].url);
                card.setButton({ 'text': 'Detail', 'url': product.get('product_url') });
                card.setText(`The product Size system brand: ${product.get('sizesystembrand')} \n color: ${product.get('color_family')}`);
                agent.add(card);
            } else {
                agent.add(`Sorry, this product has unexpected error...try again later`);
            }

        });
    }


    async function productRecommendation(agent) {
        let missingSlots = [];
        const [user_id] = [agent.parameters['user_id']];
        if (!user_id) { missingSlots.push(`user_id`); }
        if (missingSlots.length == 1) {
            agent.add(`Looks like you didn't provide a ${missingSlots[0]}? You can find it in your profile.`);
        } else {
            let query = new AV.Query('Recommend');
            query.equalTo('uId', `${user_id}`);
            let recommend = await query.find();
            let products = recommend[0].get('products');
            products.forEach(function (product, index) {
                let p = JSON.parse(product);
                console.log(p.title)
                let card = new Card(p.title);
                if (p.imageUrl) {
                    card.setImage(p.imageUrl)
                    card.setButton({ 'text': 'Detail', 'url': `${p.pId}` })
                    card.setText(p.description)
                    agent.add(card)
                }
            });
        }


    }


    let intentMap = new Map();
    intentMap.set("product.search.detail", productSearch);
    intentMap.set("Default Welcome Intent", welcome);
    intentMap.set("product.browser", browseProduct);
    intentMap.set("product.browse.search", browseProductSearch);
    intentMap.set("product.browse.search - more", browseProductSearchContinue);
    intentMap.set("product.recommendation", productRecommendation);
    agent.handleRequest(intentMap);
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

function createResponseCarousel(textResponse) {
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
            {
                "carouselSelect": {
                    "items": [
                        {
                            "info": {
                                "key": "",
                                "synonyms": ["a", "b"]
                            },
                            "title": "sds",
                            "description": "sdnsidnsidni",
                            "image": {
                                "image_uri": "hhsudhusd",
                                "accessibility_text": "sdnisndin"
                            }
                        },

                    ]
                }
            }
        ],
        "source": "example.com",
        "payload": {
        }
    };
    return response;
}


function createQuickResponse(textResponse) {
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
            {
                "quick_replies": {
                    "title": "sdnhusdhi",
                    "quick_replies": [
                        "shduhsu",
                        "dhhdhdhdhd"
                    ]
                }
            }
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
