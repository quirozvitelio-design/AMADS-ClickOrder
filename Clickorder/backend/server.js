const express = require("express")
const cors = require("cors")
const { conectar } = require("./config/db")

const app = express()
app.use(cors())
app.use(express.json())

conectar()

app.use("/api/login",    require("./routes/login"))
app.use("/api/productos", require("./routes/productos"))
app.use("/api/pedidos",   require("./routes/pedidos"))
app.use("/api/usuarios",  require("./routes/usuarios"))
app.use("/api/roles",     require("./routes/roles"))

app.listen(3000, () => console.log("Servidor en puerto 3000"))