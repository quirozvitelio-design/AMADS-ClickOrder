const sql = require("mssql")

const config = {

user: "sa",
password: "1234",
server: "localhost",
database: "ClickOrder",
port: 1433,

options:{
encrypt:false,
trustServerCertificate:true
}

}

async function conectar(){

try{

await sql.connect(config)
console.log("Conectado a SQL Server")

}catch(error){

console.log("Error conexión:", error)

}

}

module.exports = { sql, conectar }