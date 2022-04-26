class Engine{
    constructor(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.01,1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.light = new THREE.PointLight(0xffffff,0.1,10000);
        this.light.castShadow = true;
        this.light.position.set(0,100,0);
        this.scene.add(this.light);
        //this.scene.add(this.light2);
        //this.scene.background = new THREE.Color( 0xaaccff );
        this.scene.background = new THREE.Color( 0x0d0c2b );
        this.actors = {};
        this.entities = {};
        this.objects = {};
        this.arrObjects = [];
        this.arrEntities = [];
        this.arrPhysical = [];
        this.info = {};
        this.attached = {};
        this.running = true;
    }
    render(){
        this.renderer.render(this.scene,this.camera);
    }
    update(time){
        for(let i=0;i<Object.keys(this.actors).length;i++){
            this.actors[Object.keys(this.actors)[i]].update(time);
        }
    }
    addObject(id,obj){
        this.objects[id] = obj;
        this.arrObjects.push(obj);
        this.scene.add(obj);
    }
    addActor(act){
        this.actors[`${act.id}`] = act;
        this.arrEntities.push(act);
        this.arrObjects.push(act.object3d);
        this.objects[act.id] = act.object3d;
        this.scene.add(act.object3d);
    }
    addEnemy(enemy){
        this.addActor(enemy);
        this.arrPhysical.push(enemy.object3d);
    }
    remove(actor,physical=false){
        if(this.arrObjects.indexOf(actor.object3d) != -1){
            this.arrObjects.splice(this.arrObjects.indexOf(actor.object3d),1);
        }  
        if(this.arrEntities.indexOf(actor) != -1){
            this.arrEntities.splice(this.arrEntities.indexOf(actor),1);
        }  
        if(physical){
            this.arrPhysical.splice(this.arrPhysical.indexOf(actor.object3d),1);
        }
        actor.object3d.removeFromParent();
    }
}

class Player{
    constructor(x,y,z){
        this.id = 'player';
        this.velocity = new THREE.Vector3(0,0,0);
        this.object3d = new THREE.Group();
        this.object3d.position.set(x,y,z);
        this.object3d.add(engine.camera);
        this.object3d.userData.parent = this;
        this.inventory = [];
        this.currentGun = 0;
        this.running = 1;
        this.movement = {'front':false,'back':false,'left':false,'right':false,'jump':false};
        this.primaryAction = false;
        this.secondaryAction = false;
        this.rc = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0),0,1);
        this.rc2 = new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,1.01);
        this.RayCaster = new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,0.9);
        this.stable = true;
        engine.controls = new THREE.PointerLockControls(this.object3d,document.body);
        document.body.addEventListener('click',()=>{
            engine.controls.lock();
        })
    }
    move(delta,x,y,z){
        this.object3d.translateX(x*delta/1000);
        this.object3d.translateY(y*delta/1000);
        this.object3d.translateZ(z*delta/1000);
    }
    inObject(objects){
        this.rc.ray.origin.copy(this.object3d.position);
        let intersections = this.rc.intersectObjects(objects,false);
        return intersections.length > 0;
    }
    onObject(objects){
        this.rc2.ray.origin.copy(this.object3d.position);
        let intersections = this.rc2.intersectObjects(objects,false);
        return intersections.length > 0;
    }
    collide(direction,objects){
        let intersections;
        switch(direction){
            case 'front':
                this.RayCaster.ray.origin.set(0,-1,-0.25);
                this.object3d.localToWorld(this.RayCaster.ray.origin);
                this.RayCaster.ray.origin.y = this.object3d.position.y;
                intersections = this.RayCaster.intersectObjects(objects,false);
                return intersections.length > 0;
            break;
            case 'back':
                this.RayCaster.ray.origin.set(0,-1,0.25);
                this.object3d.localToWorld(this.RayCaster.ray.origin);
                this.RayCaster.ray.origin.y = this.object3d.position.y;
                intersections = this.RayCaster.intersectObjects(objects,false);
                return intersections.length > 0;
            break;
            case 'left':
                this.RayCaster.ray.origin.set(-0.25,-1,0);
                this.object3d.localToWorld(this.RayCaster.ray.origin);
                this.RayCaster.ray.origin.y = this.object3d.position.y;
                intersections = this.RayCaster.intersectObjects(objects,false);
                return intersections.length > 0;
            break;
            case 'right':
                this.RayCaster.ray.origin.set(0.25,-1,0);
                this.object3d.localToWorld(this.RayCaster.ray.origin);
                this.RayCaster.ray.origin.y = this.object3d.position.y;
                intersections = this.RayCaster.intersectObjects(objects,false);
                return intersections.length > 0;
            break;
        }
    }
    update(time){
        let delta = time;
        let mod = 1;
        let mod2 = delta/mod;
        let maxSpeed = 0.1*this.running;
        let moveSpeed = 0.25;
        let slowSpeed = 1;
        if(this.movement.front === true){
            if(this.velocity.x < maxSpeed) this.velocity.x += moveSpeed * mod2 * this.running;
        }
        else if(this.movement.back === true){
            if(this.velocity.x > -maxSpeed) this.velocity.x -= moveSpeed * mod2  * this.running;
        }
        else{
            if(this.velocity.x > 0){
                this.velocity.x -= slowSpeed * mod2;
            }
            else if(this.velocity.x < 0){
                this.velocity.x += slowSpeed * mod2;
            }
            if(this.velocity.x > -0.01 && this.velocity.x < 0.01){
                this.velocity.x = 0;
            }
        }
        if(this.movement.right === true){
            if(this.velocity.z < maxSpeed) this.velocity.z += moveSpeed * mod2  * this.running;
        }
        else if(this.movement.left === true){
            if(this.velocity.z > -maxSpeed) this.velocity.z -= moveSpeed * mod2  * this.running;
        }
        else{
            if(this.velocity.z > 0){
                this.velocity.z -= slowSpeed * mod2;
                if(this.velocity.z < -maxSpeed){
                    this.velocity.z = -moveSpeed;
                }
            }
            else if(this.velocity.z < 0){
                this.velocity.z += slowSpeed * mod2;
                if(this.velocity.z > maxSpeed){
                    this.velocity.z = maxSpeed;
                }
            }
            if(this.velocity.z > -0.01 && this.velocity.z < 0.01){
                this.velocity.z = 0;
            }
        }
        if(this.movement.jump === true && this.canJump){
            this.velocity.y = 0.185;
            this.canJump = false;
            this.jump = true;
        }
        if(!this.onObject(engine.arrObjects)){
            if(this.velocity.y > -1){
                this.velocity.y -= 0.01;
                if(this.onObject(engine.arrObjects) && !this.jump){
                    this.velocity.y = 0;
                }
            }
        }
        if(this.onObject(engine.arrObjects) && !this.jump){
            if(!this.canJump){
                this.canJump = true;
            }
            this.velocity.y = 0;
            while(this.inObject(engine.arrObjects)){
                this.object3d.position.y += 0.01;
            }
        }
        if(this.jump){
            this.jump = false;
        }
        if(this.collide("front",engine.arrObjects) && this.velocity.x > 0){
            this.velocity.x = 0;
        } 
        if(this.collide("back",engine.arrObjects) && this.velocity.x < 0){
            this.velocity.x = 0;
        } 
        if(this.collide("left",engine.arrObjects) && this.velocity.z < 0){
            this.velocity.z = 0;
        } 
        if(this.collide("right",engine.arrObjects) && this.velocity.z > 0){
            this.velocity.z = 0;
        }
        try{
            document.getElementById("speed").innerText = `${this.inventory[this.currentGun].fireDelay}`;
        }
        catch(e){}
        
        this.object3d.position.y += this.velocity.y;
        engine.controls.moveForward(this.velocity.x);
        engine.controls.moveRight(this.velocity.z);

        this.inventory.forEach((gun,index)=>{
            gun.update(time);
        })
        if(this.primaryAction) this.inventory[this.currentGun].fire();

    }
    init(){
        for(let i=0;i<this.inventory.length;i++){
            this.inventory[i].model.translateZ(-2);
        }
        this.inventory[this.currentGun].model.translateZ(2);
    }
    addGun(gun){
        this.object3d.add(gun.model);
        this.inventory.push(gun);
    }
    switchGun(number){
        this.inventory[this.currentGun].model.translateZ(-2)
        this.currentGun = number;
        this.inventory[this.currentGun].model.translateZ(2);
    }
}
class Tracer{
    constructor(points,time,color){
        this.origin = points[0];
        this.target = points[1];
        this.initialTime = time;
        this.time = time;
        this.alpha = 100;
        this.color = color;
        let material = new THREE.LineBasicMaterial({color:this.color});
        let geometry = new THREE.BufferGeometry().setFromPoints( points );
        let line = new THREE.Line( geometry, material );
        this.line = line;
        engine.scene.add( line );

    }
    update(time){
        if(this.time < 0){
            this.line.removeFromParent();
        }
        else{
            this.time -= time;
        }
    }

}

class Gun{
    constructor(id,damage,flash,recoil,rpm,hitscan,dispersion,sound){
        this.id = id;
        this.model = null;
        this.offset = new THREE.Vector3(0,0,0);
        this.damage = damage;
        this.recoil = recoil/1000;
        this.flashTimeTotal = flash;
        this.flashTime = 0;
        this.cRecoil = 0;
        this.control = new THREE.AnimationMixer(this.model);
        this.rpm = rpm;
        this.sound = sound;
        this.hitscan = hitscan;
        this.fireDelay = 0;
        this.tracers = [];
        this.clips = {};
        this.animState = "ready";
        this.muzzleRender = null;
        this.dispersion = dispersion;
        this.raycaster = new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(),0,1000);
        let texture = textureLoader.load('assets/textures/flash.png');
        let mat = new THREE.SpriteMaterial({
            map:texture,
        })
        this.flash = new THREE.Sprite(mat);
        this.mFlashLight = new THREE.PointLight(0xFFA833,5,5);
        this.flash.add(this.mFlashLight);
    }
    fire(){
        if(this.fireDelay == 0){
            this.muzzle.add(this.flash);
            this.flashTime = this.flashTimeTotal;
            this.sound.play('fire');
            this.cRecoil += this.recoil;
            this.fireDelay = 1/(this.rpm/60);
            this.clips.fire.reset();
            this.clips.fire.setDuration(this.fireDelay);
            this.clips.fire.play();
            let mV = this.muzzle.position.clone();
            engine.camera.getWorldDirection(this.raycaster.ray.direction);
            let d1 = THREE.MathUtils.randFloat(-this.dispersion,this.dispersion);
            let d2 = THREE.MathUtils.randFloat(-this.dispersion,this.dispersion);
            let d3 = THREE.MathUtils.randFloat(-this.dispersion,this.dispersion);
            let d = new THREE.Vector3(d1,d2,d3);
            this.raycaster.ray.direction.add(d);
            this.muzzle.localToWorld(mV);
            this.raycaster.ray.origin.copy(mV);
            let intersections = this.raycaster.intersectObjects(engine.arrPhysical);
            let points = [];
            points.push(this.raycaster.ray.origin.clone());
            let v1 = this.raycaster.ray.origin.clone();
            let v2 = this.raycaster.ray.direction.clone();
            v2.multiplyScalar(100);
            v1.add(v2);
            points.push(v1);
            if(engine.debug){
                let tracer = new Tracer(points,0.000250,0xffff00);
                this.tracers.push(tracer);
            }
            if(intersections.length > 0){
                if(this.hitscan){
                    for(let i=0;i<intersections.length;i++){
                        if(engine.arrPhysical.includes(intersections[i].object)){
                            intersections[i].object.userData.parent.onHit(this);
                            console.log(intersections[i].object.userData.parent.health);
                        }
                    }
                }
                else{
                    if(engine.arrPhysical.includes(intersections[0].object)){
                        intersections[0].object.userData.parent.onHit(this);
                        console.log(intersections[0].object.userData.parent.health);
                    }
                }
            }
            return true;
        }
    }
    update(time){
        this.control.update(time);
        if(this.fireDelay > 0){
            this.fireDelay -= time;
        }
        if(this.fireDelay < 0){
            this.fireDelay = 0;
        }
        if(this.cRecoil > 0){
            this.cRecoil -= time/10;
        }
        else if(this.cRecoil < 0){
            this.cRecoil = 0;
            this.offset.set(0,0,0);
        }
        if(this.checking){
            this.b += time;
        }
        if(this.flashTime > 0){
            this.flashTime -= time;
        }
        else if(this.flashTime < 0){
            this.flashTime = 0;
            this.flash.removeFromParent();
        }
    }
    setModel(model){
        this.model = model;
        this.muzzle = new THREE.Object3D();
        this.model.add(this.muzzle);
        let geometry = new THREE.BoxGeometry(1,1,1);
        let material = new THREE.MeshBasicMaterial({
            color:0x00ff00
        });
        let mesh = new THREE.Mesh(geometry,material);
        this.muzzleDebug = mesh;
        this.default = this.model.position.clone();
    }
    enableMuzzle(val){
        if(val){
            this.muzzle.add(this.muzzleDebug);
        }
        else{
            this.muzzleDebug.removeFromParent();
        }
    }
}

class Actor{
    constructor(){
        let geometry = new THREE.BoxGeometry(1,2,1);
        let material = new THREE.MeshPhongMaterial({color:0xff0000});
        this.object3d = new THREE.Mesh(geometry,material);
        this.object3d.position.set(0,1,0);
    }
    init(){

    }
    update(){

    }
    onHit(event){

    }
}

class Enemy extends Actor{
    constructor(id,health){
        super();
        this.id = id;
        this.totalHealth = health;
        this.health = health;
        this.object3d.userData.parent = this;
        this.dead = false;
    }
    update(time){
        if(this.health <= 0 && !this.dead){
            this.dead = true;
            engine.remove(this,true);
        }
        if(this.object3d.position.distanceTo(engine.player.object3d.position) < 25){
            this.object3d.lookAt(engine.player.object3d.position);
            let move = 0.1;
            this.object3d.translateZ(move);
        }
        this.object3d.position.y = 1;
    }
    onHit(data){
        this.health -= data.damage;
    }
}

const engine = new Engine();
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new THREE.GLTFLoader();

function preload(){
    console.log("loading...");
    let player = new Player(0,2,0);
    engine.addActor(player);
    engine.player = player;
    let thompsonSound = new Howl({
        src:["assets/sounds/thompson_fire.mp3"],
        sprite:{
            fire: [500,2000]
        }
    });
    let sniperSound = new Howl({
        src:["assets/sounds/sniper_fire.mp3"],
        sprite:{
            fire: [1000,6000]
        },
        volume:1
    })
    let HPSound = new Howl({
        src:["assets/sounds/heavy_pistol_fire.mp3"],
        sprite:{
            fire:[0,1000]
        }
    })
    let minigun = new Gun(0,50,-1,2,1500,false,0.1,thompsonSound);
    let heavy_pistol = new Gun(1,50,0.05,2,100,false,0.001,HPSound);
    let sniper = new Gun(2,200,0.05,0,60,true,0,sniperSound);

    let p1 = new Promise((res,rej)=>{
        gltfLoader.load("./assets/models/minigun/scene.gltf",(gltf)=>{
            minigun.setModel(gltf.scene,gltf.animations);
            minigun.model.rotateY(Math.PI);
            minigun.model.position.set(0.15,-0.4,-0.5);
            minigun.muzzle.position.set(0.03,0.1,0.15);
            minigun.flash.position.set(-0.05,0,0.6);
            minigun.anims = THREE.AnimationClip.findByName(gltf.animations, "allanims");
            minigun.clips['fire'] = minigun.control.clipAction(THREE.AnimationUtils.subclip(minigun.anims,'fire',0,6,24),minigun.model);
            minigun.clips.fire.setLoop(THREE.LoopOnce,1);
            minigun.clips['ready'] = minigun.control.clipAction(THREE.AnimationUtils.subclip(minigun.anims,'ready',171,209,24),minigun.model);
            minigun.clips.ready.setLoop(THREE.LoopPingPong,Infinity);
            minigun.clips.ready.setEffectiveTimeScale(0.2);
            console.log("loaded minigun");
            res();
        });
    })
    let p2 = new Promise((res,rej)=>{
        gltfLoader.load("./assets/models/heavy_pistol/scene.gltf",(gltf)=>{
            heavy_pistol.setModel(gltf.scene,gltf.animations);
            heavy_pistol.model.scale.set(0.01,0.01,0.01);
            heavy_pistol.model.rotateY(Math.PI);
            heavy_pistol.model.position.set(0.15,-0.2,-0.3);
            heavy_pistol.muzzle.position.set(0,7,25);
            heavy_pistol.flash.position.set(-2.5,0,0);
            heavy_pistol.flash.scale.set(100,100,100);
            heavy_pistol.anims = THREE.AnimationClip.findByName(gltf.animations, "allanims");
            heavy_pistol.clips['fire'] = heavy_pistol.control.clipAction(THREE.AnimationUtils.subclip(heavy_pistol.anims,'fire',0,12,24),heavy_pistol.model);
            heavy_pistol.clips.fire.setLoop(THREE.LoopOnce,1);
            heavy_pistol.clips['ready'] = heavy_pistol.control.clipAction(THREE.AnimationUtils.subclip(heavy_pistol.anims,'ready',219,248,24),heavy_pistol.model);
            heavy_pistol.clips.ready.setLoop(THREE.LoopPingPong,Infinity);
            heavy_pistol.clips.ready.setEffectiveTimeScale(1);
            console.log("loaded heavy pistol");
            res();
        });
    });
    let p3 = new Promise((res,rej)=>{
        gltfLoader.load("./assets/models/sniper/scene.gltf",(gltf)=>{
            sniper.setModel(gltf.scene,gltf.animations);
            sniper.model.scale.set(0.01,0.01,0.01);
            sniper.model.rotateY(Math.PI);
            sniper.model.position.set(0.15,-0.2,-0.3);
            sniper.muzzle.position.set(2,5,25);
            sniper.flash.position.set(-5,2.5,65);
            sniper.flash.scale.set(150,150,150);
            sniper.mFlashLight.intensity = 10;
            sniper.anims = THREE.AnimationClip.findByName(gltf.animations, "allanims");
            sniper.clips['fire'] = sniper.control.clipAction(THREE.AnimationUtils.subclip(sniper.anims,'fire',0,11,24),sniper.model);
            sniper.clips.fire.setLoop(THREE.LoopOnce,1);
            sniper.clips['ready'] = sniper.control.clipAction(THREE.AnimationUtils.subclip(sniper.anims,'ready',219,248,24),sniper.model);
            sniper.clips.ready.setLoop(THREE.LoopPingPong,Infinity);
            sniper.clips.ready.setEffectiveTimeScale(1);
            console.log("loaded sniper");
            res();
        });
    });

    Promise.all([p1,p2,p3]).then(()=>{
        player.addGun(heavy_pistol);
        player.addGun(minigun);
        player.addGun(sniper);
        init()
    });
}

function init(){
    console.log("initializing...");
    let player = engine.player;
    let grass = textureLoader.load('assets/textures/grass2.jpg');
    grass.wrapS = THREE.RepeatWrapping;
    grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(100,100);
    engine.addObject('plane',new THREE.Mesh(new THREE.BoxGeometry(100,100,1),new THREE.MeshPhongMaterial({map:grass,side:THREE.DoubleSide})));
    engine.objects.plane.rotateX( - Math.PI / 2 );
    engine.objects.plane.recieveShadow = true;
    let stone = textureLoader.load('assets/textures/stone.jpeg');

    
    for(let i=0;i<100;i++){
        let enemy = new Enemy(`enemy${i}`,100);
        engine.addEnemy(enemy);
        let rX = THREE.MathUtils.randInt(-50,50);
        let rZ = THREE.MathUtils.randInt(-50,50);
        enemy.object3d.position.set(rX,1,rZ);
    }

    let crosshair = new THREE.Group();
    let p1 = [];
    let p2 = [];
    p1.push(new THREE.Vector3(0,0.002,0));
    p1.push(new THREE.Vector3(0,-0.002,0));
    p2.push(new THREE.Vector3(0.002,0,0));
    p2.push(new THREE.Vector3(-0.002,0,0));
    let g1 = new THREE.BufferGeometry().setFromPoints(p1);
    let g2 = new THREE.BufferGeometry().setFromPoints(p2);
    let mat = new THREE.LineBasicMaterial({
        color:0x000000
    });
    let l1 = new THREE.Line(g1,mat);
    let l2 = new THREE.Line(g2,mat);
    crosshair.add(l1);
    crosshair.add(l2);
    engine.camera.add(crosshair);
    crosshair.position.set(0,0,-0.1);

    const onKeyDown = function ( event ) {
        if(event.repeat){
            return;
        }
        switch ( event.code ) {
            case 'KeyW':
                player.movement.front = true;
            break;
            case 'KeyA':
                player.movement.left = true;
            break;
            case 'KeyS':
                player.movement.back = true;
            break;
            case 'KeyD':
                player.movement.right = true;
            break;
            case 'Space':
                player.movement.jump = true;
            break;
            case 'KeyP':
                if(engine.running){
                    engine.running = false;
                }
                else{
                    engine.running = true;
                }
            break;
            case 'Period':
                engine.update(1);
                engine.render();
            break;
            case 'Comma':
                console.log(engine.player.collide('front',engine.arrObjects));
                //engine.scene.add(new THREE.ArrowHelper(engine.player.rays.front.ray.direction.clone(),engine.player.rays.front.ray.origin.clone(),1));
            break;
            case 'Digit1':
                engine.player.switchGun(0);
            break;
            case 'Digit2':
                engine.player.switchGun(1);
            break;
            case 'Digit3':
                engine.player.switchGun(2);
            break;
            case 'ShiftLeft':
                engine.player.running = 2;
            break;
        }
    };

    const onKeyUp = function ( event ) {
        switch ( event.code ) {
            case 'KeyW':
                player.movement.front = false;
            break;
            case 'KeyA':
                player.movement.left = false;
            break;
            case 'KeyS':
                player.movement.back = false;
            break;
            case 'KeyD':
                player.movement.right = false;
            break;
            case 'Space':
                player.movement.jump = false;
            break;
            case 'ShiftLeft':
                player.running = 1
            break;
        }
    };

    const onMouseDown = function ( event ){
        if(document.hasFocus()){
            if(event.button == 0){
                player.primaryAction = true;
            }
        }
    }

    const onMouseUp = function ( event ){
        if(document.hasFocus()){
            if(event.button == 0){
                player.primaryAction = false;
            }
        }
    }

    document.addEventListener('mousedown',onMouseDown);
    document.addEventListener('mouseup',onMouseUp);
    document.addEventListener('keydown',onKeyDown);
    document.addEventListener('keyup',onKeyUp);
    console.log("done loading")
    player.init();
    animate();
}

let prevTime;

function animate(time){
    requestAnimationFrame(animate);
    engine.render();
    if(engine.running){
        let delta = (time-prevTime)/1000;
        engine.update(delta);
        prevTime = time;
    }
}

const onLoad = function ( event ){
    preload();
}

document.addEventListener('DOMContentLoaded',onLoad);