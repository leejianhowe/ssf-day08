const fetch = require('node-fetch')
const crypto = require('crypto')
const withQuery = require('with-query').default

const url = 'https://gateway.marvel.com/v1/public/characters'
const apikey = process.env.API_KEY
const privateKey = process.env.PRIVATE_KEY
const marvelCharacter = process.argv[2]

// uuid changes every request
const ts = Date.now().toString()
console.log(ts)

const hash = crypto.createHash('md5').update(ts).update(privateKey).update(apikey).digest("hex");

const fullUrl = withQuery(url,{
  ts: ts,
  apikey : apikey,
  hash: hash,
  name: marvelCharacter,
})

console.log(hash)

const getData = async () => {

  const response = await fetch(fullUrl)
	const json = await response.json();
  const results = json.data.results
  console.log(results);
  for (i=0;i<results.length;i++)
  {
    // console.log(results[i])
  }
}

getData()
