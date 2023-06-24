const express = require('express');
const app = express();
const path = require('path');

const api = require("./routes/crud");

let __DATA__SCHEMA__ = 'techlympic';

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', './views');

//console.log('directory name-path: ',path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for rendering the map page
app.get('/', (req, res) => {
  res.render('quiz');
});

app.post('/api/quiz/qustions', (req, res) =>{
  api.quiz.questions((data)=>{
    res.send(data);
  })
});

// Start the server

app.listen(process.env.APPLICATION_PORT, function () {
  console.log('Server started on port ' + process.env.APPLICATION_PORT);
});
