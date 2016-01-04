/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

//var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var MONGO_URL = 'mongodb://localhost:27017/imap_data';
var _ = require('underscore');
var limdu = require('limdu');
var natural = require('natural');

var parseEmailAddress = require('email-addresses').parseOneAddress;
var tokenize = new natural.WordTokenizer().tokenize;

var app = express();

var mongo;


app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/api/add-class', function(req, res) {
  console.error('req.body', req.body);
  var _id = new ObjectID(req.body.emailId);
  var clazz = req.body.clazz;

  mongo.findAndModify({_id: _id}, [], {
    $addToSet: { userClasses: clazz }
  }, {
    upsert: false,
    fields: {
      text: 0
    }
  }, function(err, results) {
    console.error('err', err);
    console.error('results', results.value);
    res.setHeader('Cache-Control', 'no-cache');
    res.json({success: true});
  });

});

app.post('/api/search', function(req, res) {
  var searchString = req.body.text;
  console.error('searchString', searchString);
  mongo.find({$text: {$search: searchString}},
    {
      'text.plain': 1,
      'headers.subject':1,
      'headers.from': 1,
      'headers.date':1,
      userClasses: 1
    })
    .sort({date:-1}).limit(20).toArray(function(err, result) {
    console.error('result', result);
    if (err) throw err;
    var responseData = result.map(function(email) {
      return {
        id: email._id,
        date: email.headers && email.headers.date,
        subject: email.headers && email.headers.subject && email.headers.subject[0],
        from: email.headers.from && email.headers.from[0],
        text: email.text && email.text.plain && email.text.plain.substring(0, 1000),
        labels: email.userClasses || []
      };
    });
    console.error('responseData', responseData);
    res.setHeader('Cache-Control', 'no-cache');
    return res.json(responseData);
  });
});

function generateClassifierObject(email) {
  var obj = {};
  var headers = email.headers;
  if (!(headers && headers.to && headers.from && headers.subject)) {
    return null;
  }

  //console.error('headers.to', headers.to);
  var to = _.omit(parseEmailAddress(headers.to[0]), 'parts');
  //var from = _.omit(parseEmailAddress(headers.from[0]), 'parts');
  //var subject = tokenize(headers.subject[0]);

  //obj['__TO_NAME__'+to.name] = 1;
  obj['__TO_ADDRESS__'+to.address] = 1;

  /*obj['__FROM_NAME__'+from.name] = 1;
  obj['__FROM_ADDRESS__'+from.address] = 1;
  obj['__FROM_DOMAIN__'+from.domain] = 1;*/

  //for (var j in subject) {
    //obj['__SUBJECT__'+subject[j]] = 1;
  //}

  //console.error('obj', obj);
  return obj;
}

function trainClassifier(count, query, clazz, classifier, callback) {
  //mongo.find({userLabels: {$exists:true}}).toArray(function(err, emails) {
  mongo.find(query).limit(count || 20).toArray(function(err, emails) {
    if (err) throw err;

    console.error('emails.length', emails.length);
    var trainingSet = [];
    for (var i in emails) {

      var obj = { input: generateClassifierObject(emails[i]), output: clazz };
      if (!obj.input) continue;

      trainingSet.push(obj);
    }

    classifier.trainBatch(trainingSet);
    callback();
  });
}

MongoClient.connect(MONGO_URL, function(err, db) {
  if (err) throw err;

  mongo = db.collection('imap-test');

  //mongo.ensureIndex({
    //'$**': 'text',
    //'headers.subject': 'text',
    //'text.plain': 'text'
  //}, function(err) {
    //if (err) throw err;
    app.listen(app.get('port'), function() {
      console.log('Server started: http://localhost:' + app.get('port') + '/');
    });
  //});
  var labelClassifier = new limdu.classifiers.Bayesian();
  trainClassifier(300, {'x-gm-labels': {$elemMatch: {$eq: '2570'}}},
    '2570', labelClassifier, function() {
  trainClassifier(300, { $and: [
      {'headers.to': { $elemMatch: { $regex: /smurthas@gmail/ } } },
      {'headers.to': { $elemMatch: { $regex: /^[^w570]+$/ } } }
    ]},
    'smurthas', labelClassifier, function() {

      //mongo.find({'x-gm-labels': {$elemMatch: {$eq: '2570'}}})
      mongo.find({})
        .skip(500).limit(200).toArray(function(err, results) {
        if (err) throw err;

        var labeledNotClassified = 0, labeledAndClassified = 0;
        var notLabeledButClassified = 0, notLabeledNotClassified = 0;
        results.forEach(function(email) {
          var obj = generateClassifierObject(email);
          if (!obj) {
            console.log('null obj, headers:', email.headers);
            return;
          }
          var classification = labelClassifier.classify(obj, 2);
          var isClassified2570 = classification.classes === '2570';
          var isLabeled2570 = email.headers && email.headers['x-gm-labels'] &&
                  email.headers['x-gm-labels'].indexOf('2570') !== -1;
          if (isLabeled2570) {
            if (isClassified2570) {
              labeledAndClassified++;
            } else {
              labeledNotClassified++;

            }
          } else {
            if (isClassified2570) {
              notLabeledButClassified++;
              console.error('\nnot labeled but Classified');
              console.error('email.headers', email.headers);
              console.error('obj', obj);
              console.error('classification', classification);
            } else {
              notLabeledNotClassified++;
            }
            console.error('obj', obj);
            console.error('classification', classification);
          }
        });
          console.error('labeledAndClassified', labeledAndClassified);
          console.error('[x] labeledNotClassified', labeledNotClassified);
          console.error('[x] notLabeledButClassified', notLabeledButClassified);
          console.error('notLabeledNotClassified', notLabeledNotClassified);

        //console.error('count', count);
      });
    });
  });
});


