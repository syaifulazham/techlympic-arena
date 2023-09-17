const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');

const axios = require('axios');

const auth = require("./routes/auth")
const api = require("./routes/crud");

let __DATA__SCHEMA__ = 'techlympic';

const url = 'https://staging.sparkbackend.cerebry.co';
const headers = {
  'Content-Type': 'application/json',
  'jwt-token': auth._CEREBRY_
};

async function requestToken(kp) {
  // Define the API URL and request data
  const apiUrl = `${url}/api/v11/partner/user/${kp}/token/`;

  try {
    // Make the POST request
    const response = await axios.get(apiUrl, { headers });

    return response.data;
  } catch (error) {
    // Handle any errors that occurred during the request
    console.error('Error calling API:', error.message);
    throw error; // You can choose to throw the error or handle it differently
  }
}

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', './views');

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

//set cookies
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//console.log('directory name-path: ',path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// Define a route for rendering the map page
app.get('/', (req, res) => {
  try{
    //var sessionId = mysession(req.cookies['connect.sid']);
    var session = req.cookies['arenaId'];
    console.log('my session :',session.user.data.ic);
    if(session.user.authorized){
      var uid = session.user.data.ic;
      api.user.competitions(uid, (comp)=>{
        requestToken(uid).then(data=>{
          //console.log('THE TOKEN=========>>>',data.token);
          res.render('index.ejs', { user: session.user, competitions:comp, page: '__body.ejs',token:data.token });
        }).catch(err=>{
          res.render('index.ejs', { user: session.user, competitions:comp, page: '__body.ejs',token:'' });
        })
        
      })
      
    }else{
      res.render('index.ejs', { user: {}, page: 'login.ejs' });
    }

    console.log('---------------->> ',session);
  }catch(err){
    //console.log(err);
    res.render('index.ejs', { user: {}, page: 'login.ejs' });
  }
  
  //res.render('index');
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

app.get('/quiz/:id', (req, res)=>{
  try{
    var session = req.cookies['arenaId'];
    var id = req.params.id;
    var kp = session.user.data.ic;
    
    if(id!=='style.css'){
      api.quiz.quiz(id, kp, quiz=>{
        if(quiz[0].questions_queue===quiz[0].questions){
          var arr = quiz[0].questions_queue.split(',');
          shuffleArray(arr);
          quiz[0].questions_queue = arr.join(',');
        }
        //console.log('This is my user details=========>>>>>>',session.user)
        res.render('quiz.ejs', {user: session.user, quiz:quiz[0]});
      });
    }

  }catch(err){
    console.log(err);
  }
});


app.get('/math-whiz', (req, res)=>{
  try{
    var session = req.cookies['arenaId'];
    var uid = session.user.data.ic;
    if(uid!=='style.css'){
      requestToken(uid).then(data=>{
        //console.log('THE TOKEN=========>>>',data.token);
        res.render('math.ejs', { user: session.user, token:data.token });
      }).catch(err=>{
        console.log(err);
      })
    }

  }catch(err){
    console.log(err);
  }
});

app.post('/api/user/login', (req, res)=>{
  try{
    uid = req.body.uid;
    pwd = req.body.pwd;
    api.user.login(uid, pwd, (user)=>{
      if(user.authorized){
        res.cookie('arenaId', {user:user});
        console.log('Will be rendered to index===>')
        res.send({authorized:true});
      }else{
        res.send(user);
      }
        
    });
  }catch(err){
    console.log(err);
    res.render('index.ejs', { user: {}, page: 'login.ejs' });
  }

});

app.post('/api/quiz/list', (req, res) =>{
  var p = req.body.peringkat;
  api.quiz.list(p, (result)=>{
    res.send(result);
  })
});

app.post('/api/quiz/questions', (req, res) =>{
  var p = req.body.qids;
  api.quiz.questionsSet(p, (result)=>{
    res.send(result);
  })
});


app.post('/api/quiz/answer', (req, res) =>{
  var answered = req.body.answered;
  var session = req.cookies['arenaId'];
  var quizid = answered.quizid;
  var kp = session.user.data.ic;
  var answer = answered.answer;
  var lastindex = answered.lastindex;
  var queue = answered.queue;
  
  api.quiz.answer(quizid, kp, queue, answer, lastindex, (result)=>{
    res.send(result);
  })
});


app.post('/api/quiz/complete', (req, res) =>{
  var answered = req.body.answered;
  var session = req.cookies['arenaId'];
  var quizid = answered.quizid;
  var kp = session.user.data.ic;
  var size = answered.size;
  api.quiz.completeAnswer(quizid, kp, size, (result)=>{
    res.send(result);
  })
});


app.post('/api/quiz/complete-result', (req, res) =>{
  var answered = req.body.answered;
  var session = req.cookies['arenaId'];

  //console.log(answered);
  var quizid = answered.quizid;
  var kp = session.user.data.ic;
  api.quiz.myResult(quizid, kp, (result)=>{
    res.send(result);
  })
});

app.get('/logout', function (req, res, next) {
  res.clearCookie('arenaId');
  res.redirect('/');
});

// Start the server

app.listen(process.env.APPLICATION_PORT, function () {
  console.log('Server started on port ' + process.env.APPLICATION_PORT);
});
