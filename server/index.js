const express=require('express')
const app=express()
const dotenv=require('dotenv')
dotenv.config();
const cookieParser=require('cookie-parser')
const cors=require('cors')
const path=require('path')
const connectDB=require('./config/db')
const PORT = process.env.PORT || 8000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('Server is running');
});


// Routes
app.use('/api', require('./routes/index'));

console.log(process.env.PORT);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});