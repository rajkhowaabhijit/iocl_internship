const express = require("express");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const { mongoUrl } = require("./keys");
require("./models/Subscriptions");
const Subscriptions = mongoose.model("Subscriptions");

const app = express();

app.use(express.static(path.join(__dirname, "client")));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(mongoUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => {
	console.log("connected to mongo");
});
mongoose.connection.on("error", (err) => {
	console.log("error occurs", err);
});

const publicVapidKey =
	"BOH3eB28FcyocToCU5kzS5tPu5H952AppGs3EePv_KKe04QSdjGFghjg5fUKj86rJ5HMjtHLXsHvcQnHPE7BYeU";
const privateVapidKey = "kcP63sPcl3EvUG8RWYHgiLHukq0ynRfWjZ7x_sI9sas";
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/biki52/iocl_internship/upload';
const CLOUDINARY_UPLOAD_PRESET = 'iocl_noti_icon';


webPush.setVapidDetails(
	"mailto:rajkhowaabhijit71@gmail.com",
	publicVapidKey,
	privateVapidKey
);

app.post("/subscribe", async (req, res) => {
	const subscription = req.body;
	console.log(subscription);
	try {
		const subscribed = await Subscriptions.findOne({
			subscription: subscription,
		});
		if (!subscribed) {
			const subscriptions = new Subscriptions({
				subscription,
			});
			await subscriptions.save();
			console.log("saved in DB");
		} else console.log("Already subscribed");
		res.status(201).json();
	} catch (err) {
		console.log(err);
		res.status(441).send({ error: "subscription not saved in DB" });
	}
});
app.post("/sendNotification", async (req, res) => {
	const { title, body, icon} = req.body;
	const payload = JSON.stringify({
		title: title,
		body: body,
		icon: icon
	});
	const subscriptions = await Subscriptions.find();
	subscriptions.map((obj, i) => {
		console.log(obj.subscription);
		console.log(payload);
		webPush
			.sendNotification(obj.subscription, payload)
			.catch((err) => console.log(err));
	});
	res.status(200).json();
});
app.post("/icon-upload",async(req,res)=>{
	const {file} = req.body;
	if(!file){
		return res.status(441).send({error: 'file is required'});
	}
	const data = new FormData();
    data.append('file',file)
    data.append('upload_preset',CLOUDINARY_UPLOAD_PRESET)
	await fetch(`${CLOUDINARY_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data,
      }).then(res=> res.json())
      .then(data=>{
        // console.log(data);
        return res.status(200).send({data});
      }).catch((e)=> console.log(e))
})

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`server is running on port no. ${port}`));
