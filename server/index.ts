import express from "express"

const app = express();


app.get("/", (req, res): any => {
  return res.json({
    msg: "hi"
  })
})

app.listen(3000);