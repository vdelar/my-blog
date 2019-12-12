import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDb = async (operations, res) => {
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true});
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error: error.message});
    }
}

app.get('/api/articles/:name', async (req, res) => {
    const articleName = req.params.name;

    withDb( async (db) => {
       const articleRecord = await db.collection('articles').findOne({ name: articleName});
       res.status(200).json(articleRecord);
    }, res);
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDb( async (db) => {
        const articleName = req.params.name;
        const articleRecord = await db.collection('articles').findOne({ name: articleName});

        await db.collection('articles').updateOne({ name: articleName}, 
                {'$set': { upvotes: articleRecord.upvotes + 1 } });

        const updatedArticleRecord = await db.collection('articles').findOne({ name: articleName});
        
        res.status(200).json(updatedArticleRecord);
    }, res);
});
app.get('/api/articles/:name/votes', (req, res) => {
    res.status(200).send(articlesInfo[req.params.name].upvotes.toString());
});
app.post('/api/articles/:name/add-comment', (req, res) => {
    const { userName, text } = req.body;
    const articleName = req.params.name;

    withDb( async (db) => {
        const articleRecord = await db.collection('articles').findOne({ name: articleName});
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleRecord.comments.concat({
                    'userName': userName, 
                    'text': text
                })
            }
        });

        const updatedArticleRecord = await db.collection('articles').findOne({ name: articleName});

        res.status(200).json(updatedArticleRecord);
    }, res);

});

app.get('*', (req, res) => {
    res.sendfile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, ()=> console.log('listening on port 8000'));

