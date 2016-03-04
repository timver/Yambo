var express = require('express'),
    app = express();

app.get('/api/:id', function(request, response) {
    response.json({
        prop: request.params.id
    });
});

app.get('/api', function (request, response) {
    response.send('hallo');
});

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'));
module.exports = app;
