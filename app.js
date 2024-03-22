const express = require('express')
const path = require('path')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'covid19India.db')

app.use(express.json())
let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
initDbAndServer()

//api1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
        SELECT * 
        FROM state
    ;`
  let states = await db.all(getStatesQuery)
  const format = states => {
    return {
      stateId: states.state_id,
      stateName: states.state_name,
      population: states.population,
    }
  }
  response.send(states.map(eachState => format(eachState)))
})

//api2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getRequiredStateQuery = `
        SELECT * 
        FROM state
        WHERE state_id = ${stateId}
    ;`
  let state = await db.get(getRequiredStateQuery)

  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  })
})

//api3
app.post('/districts/', async (request, response) => {
  const districtInfo = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtInfo
  const insertDistrictQuery = `
        INSERT INTO district
        (district_name,state_id,cases,cured,active,deaths)
        VALUES('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    ;`
  await db.run(insertDistrictQuery)
  response.send('District Successfully Added')
})

//api4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getRequiredDistrictQuery = `
        SELECT * 
        FROM district
        WHERE district_id = ${districtId}
    ;`
  let district = await db.get(getRequiredDistrictQuery)

  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  })
})

//api5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteRequiredDistrictQuery = `
        DELETE
        FROM district
        WHERE district_id = ${districtId}
    ;`
  await db.run(deleteRequiredDistrictQuery)

  response.send('District Removed')
})

//api6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtInfo = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtInfo
  const getRequiredDistrictQuery = `
        UPDATE district 
        SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE district_id = ${districtId}
    ;`
  await db.run(getRequiredDistrictQuery)

  response.send('District Details Updated')
})

//select sum(cases),sum(cured),sum(active),sum(deaths)
// from district group by state_id;
//api7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getRequiredStateQuery = `
      select 
      sum(cases) as totalCases,
      sum(cured) as totalCured,
      sum(active) as totalActive,
      sum(deaths) as totalDeaths
      from district 
      group by state_id 
      having state_id = ${stateId}
    ;`
  let stats = await db.get(getRequiredStateQuery)
  response.send(stats)
})

//api8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getRequiredDistrictQuery = `
        SELECT state_name as stateName 
        FROM district join state on (district.state_id = state.state_id)
        WHERE district_id = ${districtId}
    ;`
  let district = await db.get(getRequiredDistrictQuery)

  response.send(district)
})

module.exports = app