const Backend_URL = import.meta.env.VITE_BACKEND_URL
const SummaryApi={
    UserLogin:{
        url:`${Backend_URL}/api/userLogin`,
        method:"POST"
    },
    UserSignup:{
        url:`${Backend_URL}/api/userSignup`,
        method:"POST"
    }
}

export {
    SummaryApi
}