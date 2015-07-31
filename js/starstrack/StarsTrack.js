(function (THREE) {

	"use strict";
	var camera, scene, renderer, particles, geometry, material, i, h, sprite,
		particle, init, animate, player, matte, opacity, effectBlend, effectSave,
		effectVignette, renderTarget, renderTargetParams, renderModel, composer,
		info, iOpacity, positions, showMatte = true, showInfo = false,
		NUM_PARTICLES = 250;

	matte = document.getElementById("matte");
	matte.style.opacity = opacity = 1;

	info = document.getElementById("info");
	info.style.opacity = iOpacity = 0;

	function onWindowResize () {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		composer.setSize(window.innerWidth, window.innerHeight);
	}

	function render () {
		var vertices = geometry.getAttribute("position"),
			len = vertices.array.length;

		for (i = 0; i < len; i += 3) {
			vertices.array[i + 2] -= 2.5;

			if (vertices.array[i + 2] <= -1000) {
				positions[i] = Math.random() * 2000 - 1000;
				positions[i + 1] = Math.random() * 2000 - 1000;
				positions[i + 2] = Math.random() * 2000 + 1000;
			} else {
				vertices.array[i] -= 0.5;
			}
		}

		vertices.needsUpdate = true;

		geometry.addAttribute("position", vertices);
		geometry.computeBoundingSphere();
		renderer.clear();
		composer.render();

		if (!showMatte && matte.style.opacity > 0) {
			opacity -= 0.001;
			matte.style.opacity = opacity = opacity.toFixed(4);
		} else if (!showMatte)
			matte.style.display = "none";

		if (showInfo && iOpacity < 1) {
			// Getting a weird error where iOpacity is converted to a string
			iOpacity = parseFloat(iOpacity + 0.01).toFixed(2);
			info.style.opacity = iOpacity;
			iOpacity = parseFloat(iOpacity);
		}
	}

	animate = function animate () {
		requestAnimationFrame(animate);
		render();
	};

	function showNotice () {
		var notice = document.getElementById("notice");
		matte.style.display = "none";
		notice.style.display = "block";
	}

	// Handle any errors with incomplete WebGL implementations
	window.addEventListener("error", showNotice, false);

	init = (function init () {
		if (!Detector.webgl)
			return showNotice();

		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			1,
			2000
		);

		camera.position.z = 1000;

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x000000, 0.0008);

		camera.lookAt(scene.position);

		geometry = new THREE.BufferGeometry();
		positions = new Float32Array(NUM_PARTICLES * 3);

		sprite = THREE.ImageUtils.loadTexture("images/star.png");
		sprite.minFilter = THREE.LinearFilter;

		// Calculate initial positions
		for (i = 0; i < NUM_PARTICLES; i += 3) {
			positions[i] = Math.random() * 2000 - 1000;
			positions[i + 1] = Math.random() * 2000 - 1000;
			positions[i + 2] = Math.random() * 2000 - 1000;
		}

		geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();

		material = new THREE.PointCloudMaterial({
			"size": 7,
			"map": sprite,
			"blending": THREE.AdditiveBlending,
			"depthTest": false,
			"transparent" : true,
			"color": new THREE.Color(0xffffff)
		});

		particles = new THREE.PointCloud(geometry, material);

		scene.add(particles);

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);

		renderer.autoClear = false;

		// motion blur
		renderTargetParams = {
			"minFilter": THREE.LinearFilter,
			"magFilter": THREE.LinearFilter,
			"format": THREE.RGBFormat,
			"stencilBuffer": false
		};

		renderTarget = new THREE.WebGLRenderTarget(
			window.innerWidth,
			window.innerHeight,
			renderTargetParams
		);

		effectBlend = new THREE.ShaderPass(THREE.BlendShader, "tDiffuse1");

		effectSave = new THREE.SavePass(
			new THREE.WebGLRenderTarget(
				window.innerWidth,
				window.innerHeight,
				renderTargetParams
			)
		);

		effectVignette = new THREE.ShaderPass(THREE.VignetteShader);
		renderModel = new THREE.RenderPass(scene, camera);

		effectBlend.uniforms.tDiffuse2.value = effectSave.renderTarget;
		effectBlend.uniforms.mixRatio.value = 0.5;

		effectVignette.uniforms.offset.value = 0;
		effectVignette.uniforms.darkness.value = 0;
		effectVignette.renderToScreen = true;

		composer = new THREE.EffectComposer(renderer, renderTarget);
		composer.addPass(renderModel);
		composer.addPass(effectBlend);
		composer.addPass(effectSave);
		composer.addPass(effectVignette);

		renderer.clear();

		document.body.appendChild(renderer.domElement);

		window.addEventListener('resize', onWindowResize, false);

		animate();
	})();

	//
	// Youtube soundtrack
	//

	function onPlayerReady (event) {
		event.target.unMute();
		event.target.setVolume(75);
		event.target.playVideo();

		// Queue up hiding the mask
		setTimeout(function () { showMatte = false; }, 15000);
	}

	function onPlayerStateChange (event) {
		// If the player is ended, show the info on the song
		if (event.data === YT.PlayerState.ENDED) {
			showInfo = true;
		}
	}

	if (Detector.webgl) {
		YT.ready(function onYouTubeIframeAPIReady () {
			player = new YT.Player("player", {
				"height": 0, "width": 0, // Hidden, we're only looking to play the song once
				"videoId": "QJZ_agVJqu8",
				"events": {
					"onReady": onPlayerReady,
					"onStateChange": onPlayerStateChange
				}
			});
		});
	}

})(THREE);
