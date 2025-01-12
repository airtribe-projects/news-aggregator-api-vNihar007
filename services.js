const axios = require('axios');

const NEWS_API_KEY = 'abaf7578-3f5b-42ec-a444-1a54479d5944';
const NEWS_API_URL = 'https://eventregistry.org/api/v1/article/getArticles';

const getNews = async (query, dateStart, dateEnd) => {
    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                query, 
                apiKey: NEWS_API_KEY,
                lang: 'eng', 
                dateStart, 
                dateEnd, 
            },
        });
        const articles = response.data.articles || []; 
        return {
            news: articles.map(article => ({
                title: article.title,
                description: article.summary || 'No description available', 
                url: article.url,
                publishedAt: article.date, 
            })),
        };
    } catch (error) {
        console.error('Error fetching news:', error.message);
        throw new Error('Unable to fetch news at this time');
    }
};

module.exports = { getNews };