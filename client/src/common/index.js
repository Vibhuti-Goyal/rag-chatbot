const Backend_URL = import.meta.env.VITE_BACKEND_URL
const SummaryApi={
    UserLogin:{
        url:`${Backend_URL}/api/userLogin`,
        method:"POST"
    },
    UserSignup:{
        url:`${Backend_URL}/api/userSignup`,
        method:"POST"
    },
    FetchUser:{
        url:`${Backend_URL}/api/fetchUser`,
        method:"GET"
    },
    FetchAllUser:{
        url:`${Backend_URL}/api/fetchAllUser`,
        method:"GET"
    },
    UpdateUser:{
        url:`${Backend_URL}/api/updateUser`,
        method:"POST"
    }
}

export {
    SummaryApi
}