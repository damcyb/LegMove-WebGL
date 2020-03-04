// global variables
var renderer;
var scene = new THREE.Scene();
var camera;
var control;

var leg2p;//objekt pomocny do rysowania dolnej cz�ci ko�czyny
var leg1 = new THREE.Mesh(); //udo
var leg2 = new THREE.Mesh(); //piszczel + stopa

var time = [];
var coords1 = [];
var coords2 = [];
var coords2p = [];
var legData = [];

var clock = new THREE.Clock();
var mixer1;
var mixer2;
var mixer2p;

// Menu buttons
var elem;
var seekSlider;
var startButton;
var resetButton;
var duration;
var playTime;
var currentTime;
var newTime;
var tipTime;


// Boolean for start and restart
var inAction = false;
var play = false;
var pause = false;
var active = false;
var restart = false;
var end = true;

const init = () => {
    var promise = new Promise((resolve, reject) => {
        setTimeout(function() { 

            // Buttons startButton and resetButton
            startButton = document.getElementById( 'startButtonId' );
            resetButton = document.getElementById( 'resetButtonId' );
            toogle(startButton, resetButton);

            //time span
            duration = document.getElementById('fullDuration');
            playTime = document.getElementById('currentTime');
            tipTime = document.getElementById('tipTime');

            //seekSlider and progress bar
            elem = document.getElementById("bar");
            timeBarSeeking();

            //renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setClearColor(0x000000, 1.0);
            renderer.setSize( window.innerWidth, window.innerHeight );
            document.body.appendChild( renderer.domElement );

            //perspective
            camera = new THREE.PerspectiveCamera( 40, window.innerWidth/window.innerHeight, 0.1, 1000 );
            camera.position.x = -2;
            camera.position.y = 0;
            camera.position.z = -2;

            //light
            var keyLight1 = new THREE.DirectionalLight(new THREE.Color('hsl(30, 20%, 50%)'), 1.0);
            keyLight1.position.set(-100, 0, 0);

            var keyLight2 = new THREE.DirectionalLight(new THREE.Color('hsl(30, 20%, 50%)'), 1.0);
            keyLight2.position.set(100, 0, 0);

            var keyLight3 = new THREE.DirectionalLight(new THREE.Color('hsl(30, 20%, 50%)'), 1.0);
            keyLight3.position.set(0, 0, -100);

            var keyLight4 = new THREE.DirectionalLight(new THREE.Color('hsl(30, 20%, 50%)'), 1.0);
            keyLight4.position.set(0, 0, 100);

            scene.add(keyLight1);
            scene.add(keyLight2);
            scene.add(keyLight3);
            scene.add(keyLight4);

            //scene controls

            //Left mouse button and move Rotate and roll the camera around the scene
            //Scroll wheel Zoom in and zoom out
            //Right mouse button and move Pan around the scene
            addControls();

            //noga z wczytanymi danymi ustawiała się obrócona o 90 deg,
            //należało przeliczyć wszystkie dane do właściwej animacji
            let quat = new THREE.Quaternion();
            let transformationQuat1 = new THREE.Quaternion( -0.7071, 0.0, 0.0, 0.7071);
            let transformationQuat2 = new THREE.Quaternion( -0.7071, 0.0, 0.0, 0.7071);
            let transformationQuat2p = new THREE.Quaternion( 0.7071, 0.0, 0.0, 0.7071);

            let result = new THREE.Quaternion();

            legData.forEach(element => {
                time.push(parseFloat(element[0]));

                quat.set(parseFloat(element[2]), parseFloat(element[3]), parseFloat(element[4]), parseFloat(element[1]));
                result = quat.multiply(transformationQuat1);
                coords1.push(result.x, result.y, result.z, result.w);

                result = quat.multiply(transformationQuat2p);
                coords2p.push(result.x, result.y, result.z, result.w);

                quat.set(parseFloat(element[6]), parseFloat(element[7]), parseFloat(element[8]), parseFloat(element[5]));
                result = quat.multiply(transformationQuat2);
                coords2.push(result.x, result.y, result.z, result.w);
            });
            
            //set starting position
            var startingQauternionLeg1 = new THREE.Quaternion(coords1[0],coords1[1], coords1[2], coords1[3]);
            leg1.quaternion.x = startingQauternionLeg1.x;
            leg1.quaternion.y = startingQauternionLeg1.y;
            leg1.quaternion.z = startingQauternionLeg1.z;
            leg1.quaternion.w = startingQauternionLeg1.w;

            var startingQauternionLeg2p = new THREE.Quaternion(coords2p[0],coords2p[1], coords2p[2], coords2p[3]);
            leg2p.quaternion.x = startingQauternionLeg2p.x;
            leg2p.quaternion.y = startingQauternionLeg2p.y;
            leg2p.quaternion.z = startingQauternionLeg2p.z;
            leg2p.quaternion.w = startingQauternionLeg2p.w;

            var startingQauternionLeg2 = new THREE.Quaternion(coords2[0],coords2[1], coords2[2], coords2[3]);
            leg2.quaternion.x = startingQauternionLeg2.x;
            leg2.quaternion.y = startingQauternionLeg2.y;
            leg2.quaternion.z = startingQauternionLeg2.z;
            leg2.quaternion.w = startingQauternionLeg2.w;

            // show axes
            // var axesHelper = new THREE.AxesHelper( 5 );
            // scene.add( axesHelper );
            
            rotationFunction();
            animate();

        }, 300);
    });
    return promise;
};

const animate = () => {
    
    if(!inAction || end) {
        mixer1._actions[0].stop();
        mixer2p._actions[0].stop();
        mixer2._actions[0].stop();
        rotationFunction();  
    }
    if(inAction) {
        if(!active) {
            mixer1._actions[0].play();
            mixer2p._actions[0].play();
            mixer2._actions[0].play();
        }
        if(active) {
            if(play) {
                mixer1._actions[0].paused = false;
                mixer2p._actions[0].paused = false;
                mixer2._actions[0].paused = false;
            }
            if(pause) {
                mixer1._actions[0].paused = true;
                mixer2p._actions[0].paused = true;
                mixer2._actions[0].paused = true;
            }
        }
    }
    requestAnimationFrame( animate );
    render();
}

const render = () => {
    var delta = clock.getDelta();

    if ( mixer1 ) { 
        mixer1.update( delta );
    }
    if ( mixer2p ) {
        mixer2p.update( delta );
    }
    if ( mixer2 ) {
        mixer2.update( delta );
    }
    renderer.render(scene, camera);
}

const addControls = () => {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
}

const rotationFunction = () => {
        
        //animationclip - leg1
        var quaternionKF1 = new THREE.QuaternionKeyframeTrack( '.quaternion', time, coords1 );
        var clip1 = new THREE.AnimationClip( 'Action', quaternionKF1.trim(0, time[time.length - 1]) , [ quaternionKF1] );
        // setup the AnimationMixer
        mixer1 = new THREE.AnimationMixer( leg1 );
        // create a ClipAction and set it to play
        var clipAction1 = mixer1.clipAction( clip1 );
        clipAction1.play();

        //animationclip - leg2p
        var quaternionKF2p = new THREE.QuaternionKeyframeTrack( '.quaternion', time, coords2p );
        var clip2p = new THREE.AnimationClip( 'Action', quaternionKF2p.trim(0, time[time.length - 1]), [ quaternionKF2p] );
        mixer2p = new THREE.AnimationMixer( leg2p );
        var clipAction2p = mixer2p.clipAction( clip2p );
        clipAction2p.play();

        //animationclip - leg2
        var quaternionKF2 = new THREE.QuaternionKeyframeTrack( '.quaternion', time, coords2 );
        var clip2 = new THREE.AnimationClip( 'Action', quaternionKF2.trim(0, time[time.length - 1]) , [ quaternionKF2] );
        mixer2 = new THREE.AnimationMixer( leg2 );
        var clipAction2 = mixer2.clipAction( clip2 );
        clipAction2.play();

        inAction = false;
        play = false;
        pause = false;
        active = false;
        restart = false;
        end = true;
        progressTimeBar();
        timeDisplay();
};

const degToRad = (degrees) => {
    return degrees * Math.PI / 180;
};

const loadOBJs = () => {
    var material = new THREE.MeshPhongMaterial({color: 0xffffff});

    //import nogalg.obj
    // mtl file

    var mtlLoader1 = new THREE.MTLLoader();
    mtlLoader1.setTexturePath('./assets/');
    mtlLoader1.load('./assets/nogalg.mtl', function (materials) {
        materials.preload();
        
        // obj file
        var objLoader1 = new THREE.OBJLoader();
        objLoader1.setMaterials(materials);
        objLoader1.load('./assets/n1.obj', function (object) {

            //making smooth shape
            leg1 = smoothing(object, material);

            scene.add(leg1);

            //position
            leg1.position.x -= 0.0;
            leg1.position.y += 0.0;
            leg1.position.z -= 0.0;
            //rotatation
            leg1.rotateX(degToRad(0));
            leg1.rotateY(degToRad(0));
            leg1.rotateZ(degToRad(0));
        });
    });

    //import n2.obj
    // mtl file

    var mtlLoader2 = new THREE.MTLLoader();
    mtlLoader2.setTexturePath('./assets/');
    mtlLoader2.load('./assets/nogald.mtl', function (materials) {

        materials.preload();

        // obj file
        var objLoader2 = new THREE.OBJLoader();
        objLoader2.setMaterials(materials);
        objLoader2.setPath('./assets/');
        objLoader2.load('n2.obj', function (object) {

            //making smooth shape
            leg2 = smoothing(object, material);

            //leg2 = object;
            leg2p = new THREE.Object3D();
            leg2p.position.y += 0.0;
            
            scene.add(leg2p);
            leg2p.add(leg2);

            //position
            leg2.position.y -= 0.0;
            leg2.position.x += 0.35;
            leg2.position.z -= 0.0;

            //rotatation
            leg2.rotateX(degToRad(0));
            leg2.rotateY(degToRad(0));
            leg2.rotateZ(degToRad(0));
        });
    });
}

const loadFileAsync = () => {
    
    return new Promise((resolve, reject) => {
        //import exercise.txt
        let loader = new THREE.FileLoader();
        let newLegData = [];
        
        //load a text file and output the result to the console
        loader.load('./assets/exercise.txt', function ( data ) {
            
            legData.push(data);
            newLegData = legData[0].replace(/,/g, ".").split("\r\n");
            legData.splice(0, 1);
            newLegData.forEach(element => {
                legData.push(element.trim().split(' '));   
            });

            legData.splice(legData.length - 1, 1);
            loadOBJs();
            resolve(legData); 
        },
        
        // onProgress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },

        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        });
    });
};

const smoothing = (object, material) => {
    // wyszukiwanie pozycji wierzchołków pliku obj i tworzenie kopii w postaci modyfikowalnej.
    let attrib = object.children[0].geometry.getAttribute('position'); 
    let faces = [];
    let vertices = [];

    if(attrib === undefined) {
        throw new Error('a given BufferGeometry object must have a position attribute.');
    }
    let positions = attrib.array; 

    for(let i = 0, n = positions.length; i < n; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];
        vertices.push(new THREE.Vector3(x, y, z));
    }

    for(let i = 0, n = vertices.length; i < n; i += 3) {
        faces.push(new THREE.Face3(i, i + 1, i + 2));
    }
    // wygładzanie wierzchołków
    let geometry = new THREE.Geometry();
    geometry.vertices = vertices;
    geometry.faces = faces;
    geometry.computeFaceNormals();              
    geometry.mergeVertices()
    geometry.computeVertexNormals();

    let mesh = new THREE.Mesh(geometry, material);

    return mesh;
}

const progressTimeBar = () => {
     
    var width = 0;
    var id = setInterval(frame, time[time.length - 1] * 10);

    function frame() {
        if (width >= 100) {
            clearInterval(id);
            elem.style.width = 0 + '%';
            end = true;
            startButton.className = 'play';
        } 
        else if(play) {
            width = mixer1._actions[0].time / time[time.length - 1] * 100;
            elem.style.width = width + '%';
        } 
    }
}

const toogle = (startButton, resetButton) => {

    // Play/Pause Button
    startButton.onclick = function StartAnimation() {
        
        // Start
        if (!inAction) {

            inAction = true;
            play = true;
            pause = false;
            end = false;
            startButton.className = 'pause'; 
        }
        // Play and Pause 
        else {
            if(pause) {
                pause = false;
                play = true;
                startButton.className = 'pause';
            } 
            else {
                pause = true;
                play = false;
                active = true;
                startButton.className = 'play';  
            }
        }
        animate();
    }
    // Reset Button
    resetButton.onclick = function ResetParameters() {
    
        // Boolean for Stop Animation
        inAction = false;
        active = false;
        startButton.className = 'play';
        elem.style.width = 0 + '%';  
        render();
    }
}

const timeDisplay = () => {
    var durationMinutes = parseInt(time[time.length - 1] / 60);
    var durationSeconds = parseInt(time[time.length - 1] % 60);
    var playTimeSeconds;

    if(durationSeconds < 10) {
        duration.innerHTML = durationMinutes + ":0" + durationSeconds;
    }
    else {
        duration.innerHTML = durationMinutes + ":" + durationSeconds;
    }

    var updateTime = setInterval(update, 500);

    function update() {
        playTimeSeconds = mixer1._actions[0].time;
        if(mixer1._actions[0].time / time[time.length - 1] >= 1) {
            clearInterval(updateTime);
        }
        else if(playTimeSeconds < 10) {

            playTime.innerHTML = parseInt(mixer1._actions[0].time / 60) + ":0" + parseInt(mixer1._actions[0].time % 60);
        }
        else {
            playTime.innerHTML = parseInt(mixer1._actions[0].time / 60) + ":" + parseInt(mixer1._actions[0].time % 60);
        }
    }  
}

const timeBarSeeking = () => {
    var timeDrag = false;
    $('.progress-bar').on('mousedown', function(e) {
        timeDrag = true;
            updatebar(e.pageX);
    });
    $(document).on('mouseup', function(e) {
            if(timeDrag) {
                timeDrag = false;
                updatebar(e.pageX);
            }
    });
    $(document).on('mousemove', function(e) {
            if(timeDrag) {
                updatebar(e.pageX);
                $('.tooltip-con').fadeIn(200);
                var progress = $('.progress-bar');
                //calculate drag position
                //and update video currenttime
                //as well as progress bar
                var position = e.pageX - progress.offset().left;
                var percentage = 100 * position / progress.width();
                if(percentage > 100) {
                    percentage = 100;
                }
                if(percentage < 0) {
                    percentage = 0;
                }
               var x = percentage / 100 * time[time.length - 1];
               tipTime.innerHTML = timeFormat(x);
               if(position + 80 > screen.width) {
                   $('.tooltip-con').css('margin-left', screen.width - 80 +'px');
               }
               else if(position - 80 < 0) {
                   $('.tooltip-con').css('margin-left', 80 +'px');
               }
               else {
                   $('.tooltip-con').css('margin-left', position - 20 +'px');
               }
            }
    });
    var updatebar = function(x) {
        var progress = $('.progress-bar');
        
        //calculate drag position
        //and update video currenttime
        //as well as progress bar
        var maxduration = time[time.length - 1];
        var position = x - progress.offset().left;
        var percentage = 100 * position / progress.width();
        if(percentage > 100) {
            percentage = 100;
        }
        if(percentage < 0) {
            percentage = 0;
        }
        $('.progress-value').css('width', percentage +'%');
        mixer1._actions[0].time = maxduration * percentage / 100;
        mixer2._actions[0].time = maxduration * percentage / 100;
        mixer2p._actions[0].time = maxduration * percentage / 100;
        if(end) {
            end = false;
            inAction = true;
            active = true;
            pause = true;
        }
    };
    $('.progress-bar').mousemove(function(e){
        
        var progress = $('.progress-bar');
         //calculate drag position
         //and update video currenttime
         //as well as progress bar
         var position = e.pageX - progress.offset().left;
         var percentage = 100 * position / progress.width();
         if(percentage > 100) {
             percentage = 100;
         }
         if(percentage < 0) {
             percentage = 0;
         }
        var x = percentage / 100 * time[time.length - 1];
        tipTime.innerHTML = timeFormat(x);
        if(position + 80 > screen.width) {
            $('.tooltip-con').css('margin-left', screen.width - 80 +'px');
        }
        else if(position - 80 < 0) {
            $('.tooltip-con').css('margin-left', 80 +'px');
        }
        else {
            $('.tooltip-con').css('margin-left', position - 20 +'px');
        }  
    });

    $('.progress-bar').hover(function(){
        $('.tooltip-con').fadeIn(200);
        },function(){
            $('.tooltip-con').fadeOut(200);
    });
    
    var timeFormat = function(seconds){
         var m = Math.floor(seconds/60)<10 ? Math.floor(seconds/60) : Math.floor(seconds/60);
         var s = Math.floor(seconds-(m*60))<10 ? "0"+ Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
         return m+":"+s;
     };
}

//wczytywanie pliku txt z semaforem
loadFileAsync()
.then( () => {init()})
.catch(reason => console.log(reason));
THREE.Cache.enabled = true;