# Keep weather records


## Context
We find it difficult to be able to advise users which treatment they might be needing.
We were thinking a model of diseases prediction might be useful
Until now each time a user is creating a treatment, they also write in the db which disease they are fighting against
If we had the weather data along with the current active diseases this could be helpful


## Actions
We need to keep the records of weather data for each parcel somewhere.
Ideally it might be interesting to divide the data by zone, but we are not sure how to do this.

we could create a snapshot of the weather for each parcel instead of creating multiple entries in  the database


We could use a cron job and make an api call to this api
`https://api.open-meteo.com/v1/forecast?latitude=44.0998&longitude=9.7387&hourly=temperature_2m,precipitation_probability,precipitation,apparent_temperature,temperature_80m&past_days=7`

the payload is the following:
```
{
"latitude": 44.1,
"longitude": 9.74,
"generationtime_ms": 313.4922981262207,
"utc_offset_seconds": 0,
"timezone": "GMT",
"timezone_abbreviation": "GMT",
"elevation": 65,
"hourly_units": {
"time": "iso8601",
"temperature_2m": "°C",
"precipitation_probability": "%",
"precipitation": "mm",
"apparent_temperature": "°C",
"temperature_80m": "°C"
},
"hourly": {
"time": [],
"temperature_2m": [],
"precipitation_probability": [],
"precipitation": [],
"apparent_temperature": [],
"temperature_80m": []
}
}
```


## Links

https://www.sciencedirect.com/science/article/abs/pii/S0168192323003726


🍇 Agricolala - Wineyard management made simple
Lately I beta-released an app for monitoring my wineyards. Maybe this can be useful to others? For now the access is limited, dm me if you need it!

What it does:
  • Track treatments across fields
  • Monitor substance usage and compliance

For amateur winegrowers who want to keep proper records without the complexity of enterprise solutions.

What do you think? Would love feedback from fellow wine growers!
https://agricolala-eta.vercel.app/