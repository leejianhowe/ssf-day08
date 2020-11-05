const fetch = require('node-fetch')
const crypto = require('crypto')
const withQuery = require('with-query').default
const express = require('express')
const hbs = require('express-handlebars')
const {
  v4: uuidv4
} = require('uuid');




// declare env variables
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const API_KEY = process.env.API_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY



const url = 'https://gateway.marvel.com/v1/public/characters'

// fetch data from Marvel API
const makeGetData = (name) => {

  // const ts = Date.now().toString()
  // console.log('timestamp:',ts)
  // uuid changes every request
  const uuid = uuidv4()
  console.log('uuid:', uuid)

  // create hash
  // const hash = crypto.createHash('md5').update(ts).update(privateKey).update(apikey).digest("hex");
  const hash = crypto.createHash('md5').update(uuid).update(PRIVATE_KEY).update(API_KEY).digest("hex");
  console.log('hash:', hash)

  // create URL
  const fullUrl = withQuery(url, {
    ts: uuid,
    apikey: API_KEY,
    hash: hash,
    nameStartsWith: name,
  })

  const getData = fetch(fullUrl).then((result) => {
    return result.json()
  }).then(result => {
    // console.log(result)
    if (result.data.count <= 0)
      return Promise.reject('Not found')
    // for (i = 0; i < result.length; i++) {
    //   console.log(results[i])
    // }
    const heroes = result.data.results.map(element => element)
    return heroes
  }).catch((err) => {
    console.error(err)
    throw err
  })
  return getData

}
// create cache

let cacheResults = []
let cacheHeroes = []

// check cache function
function checkCache(searchParam, cache) {
  for (i = 0; i < cache.length; i++) {
    if (cache[i].searchQuery == searchParam) {
      console.log(`${searchParam} found in cacheResults`)
      // console.log(cache[i])
      return cache[i]
    }
  }
  return false
}

// find marvel heroes
function checkCacheHeroes(searchParam, cache) {
  for (i = 0; i < cache.length; i++) {
    if (cache[i].id == searchParam) {
      console.log(`${searchParam} found in cacheHeroes`)
      // console.log(cache[i])
      return cache[i]
    }
  }
  return false
}

// create instance of app
const app = express()

// set view engine
app.engine('hbs', hbs({
  defaultLayout: 'main.hbs'
}))
app.set('view engine', 'hbs')


app.get('/', (req, res) => {
  res.status(200).type('text/html')
  res.render('search')
})

app.get('/search', async (req, res) => {
  try {
    const nameStartsWith = req.query.nameStartsWith
    console.log('querySearch', nameStartsWith)
    const check = await checkCache(nameStartsWith, cacheResults)
    if (check) {
      console.log('returned cache results', nameStartsWith)
      res.status(200).type('text/html')
      res.render('results', {
        results: check.results,
        searchQuery: req.query.nameStartsWith,
      })
    } else {
      // NEW SEARCH REQUEST
      console.log(`${nameStartsWith} is new request`)
      const results = await makeGetData(nameStartsWith)
      console.log('pushing results')
      cacheResults.push({
        results: results,
        searchQuery: nameStartsWith
      })
      for (i = 0; i < results.length; i++) {
        cacheHeroes.push(results[i])
      }
      // console.log(`cacheHeroes:`, cacheHeroes)
      res.status(200).type('text/html')
      res.render('results', {
        results: results,
        searchQuery: req.query.nameStartsWith
      })
    }

  } catch (err) {
    res.status(200).type('text/html')
    res.render('none', {
      name: req.query.nameStartsWith,
      err: err
    })
  }
})

// hero details
app.get('/search/:id', (req, res) => {
  const id = parseInt(req.params.id)
  console.log(`picked id:`, id)
  const detail = checkCacheHeroes(id, cacheHeroes)
  if (detail) {
    for (i = 0; i < cacheHeroes.length; i++) {
      if (cacheHeroes[i].id === id) {
        details = cacheHeroes[i]
        break
      }
    }

    res.status(200).type('text/html')
    res.render('hero', {
      details: details
    })
  } else {
    res.status(404).type('text/html')
    res.send('Hero cannot be found')
  }


})

app.listen(PORT, () => {
  console.log(`APP listening on ${PORT} at http://localhost:${PORT}`)
})
