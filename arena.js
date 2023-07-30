const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');

const api = require("./routes/crud");

let __DATA__SCHEMA__ = 'techlympic';

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
        res.render('index.ejs', { user: session.user, competitions:comp, page: '__body.ejs' });
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

app.get('/quiz/:id', (req, res)=>{
  try{
    var session = req.cookies['arenaId'];
    var id = req.params.id;
    
    if(id!=='style.css'){
      api.quiz.quiz(id, quiz=>{
        res.render('quiz.ejs', {quiz:quiz[0]});
      });
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


app.get('/logout', function (req, res, next) {
  res.clearCookie('arenaId');
  res.redirect('/');
});

// Start the server

app.listen(process.env.APPLICATION_PORT, function () {
  console.log('Server started on port ' + process.env.APPLICATION_PORT);
});
