import { Client } from "pg";

async function getNewClient() {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port:process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        database:process.env.POSTGRES_DB,
        password:process.env.POSTGRES_PASSWORD,


    })
    await client.connect()
    return client
}
async function query(queryobject){
    let client

    try{
        client = await getNewClient()
        const result = await client.query(queryobject)
        return result
    } catch(error){
        console.error(error)
        throw error
    } finally{client.end()}
    
}
export default{query,getNewClient}