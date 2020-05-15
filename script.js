var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

let is_model_loaded = false;
let webcam;

var landmark_points;
var offset;

let cam_width;
let cam_height;
let scr_scale;

let instruction_DOM = document.getElementById("instructions");
let count_DOM = document.getElementById("countdown");
let reset_DOM = document.getElementById("reset");
let countdown = Number(count_DOM.innerText.toString());
let countRate = (isMobile.any())? 12 : 15;
let predictRate = (isMobile.any())? 6 : 2;

let count = 0;
let predict_count = 0;
let stage = 0;
let ease = 0.2;
let dx,dy;

//console.log(countdown);
//console.log(instruction_DOM.textContent.toString().length);
//console.log(faceapi.nets);

function setup(){
	createCanvas(windowWidth,windowHeight);
	noFill();
	strokeWeight(2);
	//frameRate(30);
	Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('models/'),
	faceapi.nets.faceLandmark68TinyNet.loadFromUri('models/'),
	//faceapi.nets.faceRecognition.loadFromUri('/models'),
	//faceapi.nets.faceExpressionNet.loadFromUri('/models')
	]).then(modelLoaded);
	webcam = createCapture(VIDEO);
	webcam.hide();
}

function windowResized(){
	resizeCanvas(windowWidth,windowHeight);
}

function modelLoaded(){
	console.log("model loaded");
	is_model_loaded = true;
	/*
	setInterval(async () => {
			predict();
	},100);
	*/
}

function draw(){
	translate(width/2,height/2);
	scale(-1,1);
	
	if(width>height){
		cam_width = height * webcam.width/webcam.height;
		cam_height = height;

	}else{
		cam_width = width;
		cam_height = width * webcam.height/webcam.width;

	}

	if(width>cam_width){
		scr_scale = width/cam_width;
		cam_width *= scr_scale;
		cam_height *= scr_scale;
	}else if(height>cam_height){
		scr_scale = height/cam_height;
		cam_width *= scr_scale;
		cam_height *= scr_scale;
	}

	if(is_model_loaded){

		image(	webcam,
			-cam_width/2,
			-cam_height/2,
			cam_width,cam_height);


		countdown = Number(count_DOM.innerText.toString());

		if(countdown>0){
			predict_count++;

			if(predict_count>predictRate){
				predict();
				predict_count = 0;
			}
		}

		if(landmark_points){



			count++;

			if(count>countRate){
				count = 0;
				if(countdown>0){
					count_DOM.innerText = countdown - 1 + "";
				}
			}

			if(countdown>0){
				beginShape();
				for(let i=0; i<landmark_points.length; i++){
					let x = -cam_width/2+landmark_points[i]._x;
					let y = -cam_height/2+landmark_points[i]._y;
					ellipse(x,y,4,4);
					vertex(x,y);
				}
				endShape();

				dx = landmark_points[stage]._x;
				dy = landmark_points[stage]._y;

			}else{
				instruction_DOM.innerText = "Drawing face!";
				
				dx += (landmark_points[stage]._x - dx) * ease;
				dy += (landmark_points[stage]._y - dy) * ease;

				if(dist(dx,dy,landmark_points[stage]._x,landmark_points[stage]._y)<0.1){
					stage++;
					if(stage>=landmark_points.length){
						stage = 0;
					}
				}

				let ex = -cam_width/2+dx;
				let ey = -cam_height/2+dy;

				ellipse(ex,ey,20,20);

				beginShape();
				for(let i=0; i<stage; i++){
					let x = -cam_width/2+landmark_points[i]._x;
					let y = -cam_height/2+landmark_points[i]._y;
					ellipse(x,y,4,4);
					vertex(x,y);
				}
				vertex(ex,ey);
				endShape();
				
			}

		}
	}
	
	//console.log(landmark_points);
}

reset_DOM.addEventListener("click",reset,false);

function reset(){
	count_DOM.innerText = "10";
	stage = 0;
}

async function predict(){
	let input_size = 320;
	if(isMobile.any()) input_size = 128;
	const options = new faceapi.TinyFaceDetectorOptions({ inputSize: input_size })
	const video = document.getElementsByTagName('video')[0];
	const displaySize = { width: cam_width, height: cam_height };
	const detections = await faceapi.detectAllFaces(
			video,
			new faceapi.TinyFaceDetectorOptions(options)
		).withFaceLandmarks(true)
		//console.log(detections)
		//console.log(detections[0].landmarks)
		const resizedDetections = faceapi.resizeResults(detections,displaySize);
	if(resizedDetections&&resizedDetections[0]){
		landmark_points = resizedDetections[0].landmarks._positions;
		offset = resizedDetections[0].landmarks._shift;
			//console.log(resizedDetections[0].landmarks._shift);
	}
} 
