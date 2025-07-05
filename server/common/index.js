Flask_Backend=process.env.Flask_Backend_URL

const SummaryAPI={
    StoreVectorDB:{
        url:`${Flask_Backend}/create-vectordb`,
        method:"POST"
    }
}

module.exports=SummaryAPI