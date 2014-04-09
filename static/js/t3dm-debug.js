(function ($)
{
    /**
     * Tonal 3D Modeller.
     */
    var Tonal3DModeller = function(aComposer, aPieceName, aVoicePitches, aGenerator)
    {
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PUBLIC
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Starts the app.
         */
        var start = function()
        {
            $("#info").text(aComposer + ", " + aPieceName);

            initializeHandlers();
            initializeThreejs();
            initializeLighting();
            initializeCamera();
            initializeMaterials();
            initializeVoiceRings();
            initializeHarmonyPolygon();
            mPieceCurrentPlace = 0;
            converPitchesToPitchClasses();
            setHarmonyModel(mPieceCurrentPlace);
            render();
        };

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PRIVATE
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Convert to pitch classes.
         */
        var converPitchesToPitchClasses = function()
        {
            mPiecePitches = aVoicePitches;
            mPiecePitchClasses = [];
            for(var i = 0; i < mPiecePitches.length; i++)
            {
                mPiecePitchClasses[i] = [];
                for(var j = 0; j < mPiecePitches[i].length; j++)
                {
                    mPiecePitchClasses[i][j] = convertPitchToPitchClass(mPiecePitches[i][j]);
                }
            }
        };

        /**
         * Converts scientific pitch to pitch class.
         */
        var convertPitchToPitchClass = function(aPitch)
        {
            var pitch = aPitch.trim();
            var note = pitch.substr(0, 1);
            var pitchClass = 0;
            var accidental = 0;
            if(pitch.substr(1, 1) == "#")
            {
                accidental = 1;
            }
            else if(pitch.substr(1, 1) == "b")
            {
                accidental = -1;
            }
            switch(note.toLowerCase())
            {
                case 'c':
                    pitchClass = 0;
                    break;
                case 'd':
                    pitchClass = 2;
                    break;
                case 'e':
                    pitchClass = 4;
                    break;
                case 'f':
                    pitchClass = 5;
                    break;
                case 'g':
                    pitchClass = 7;
                    break;
                case 'a':
                    pitchClass = 9;
                    break;
                case 'b':
                    pitchClass = 11;
                    break;
            }
            pitchClass += accidental;
            pitchClass = pitchClass % 12;
            return pitchClass;
        };

        /**
         * Sets harmony model.
         */
        var setHarmonyModel = function()
        {
            for(var i = 0; i < mPiecePitchClasses.length; i++)
            {
                setVoicePitchClass(i, mPiecePitchClasses[i][mPieceCurrentPlace]);
                mHarmonyModelGeometry.vertices[i] = mVoiceRingArray[i].activePitchClass.position;
            }
            mHarmonyModelGeometry.verticesNeedUpdate = true;

            // SEt previous meta data.
            if(mPieceCurrentPlace - 1 >= 0)
            {
                $('#previous_bass').text(mPiecePitches[0][mPieceCurrentPlace - 1]);
                $('#previous_tenor').text(mPiecePitches[1][mPieceCurrentPlace - 1]);
                $('#previous_alto').text(mPiecePitches[2][mPieceCurrentPlace - 1]);
                $('#previous_soprano').text(mPiecePitches[3][mPieceCurrentPlace - 1]);
            }
            else
            {
                $('#next_bass').text("");
                $('#next_tenor').text("");
                $('#next_alto').text("");
                $('#next_soprano').text("");
            }

            // Set current meta data.
            $('#current_bass').text(mPiecePitches[0][mPieceCurrentPlace]);
            $('#current_tenor').text(mPiecePitches[1][mPieceCurrentPlace]);
            $('#current_alto').text(mPiecePitches[2][mPieceCurrentPlace]);
            $('#current_soprano').text(mPiecePitches[3][mPieceCurrentPlace]);

            // SEt next meta data.
            if(mPieceCurrentPlace + 1 < mPiecePitches[0].length)
            {
                $('#next_bass').text(mPiecePitches[0][mPieceCurrentPlace + 1]);
                $('#next_tenor').text(mPiecePitches[1][mPieceCurrentPlace + 1]);
                $('#next_alto').text(mPiecePitches[2][mPieceCurrentPlace + 1]);
                $('#next_soprano').text(mPiecePitches[3][mPieceCurrentPlace + 1]);
            }
            else
            {
                $('#next_bass').text("");
                $('#next_tenor').text("");
                $('#next_alto').text("");
                $('#next_soprano').text("");
            }

            // Compute intervals.
            var intervalBT = mPiecePitchClasses[1][mPieceCurrentPlace] - mPiecePitchClasses[0][mPieceCurrentPlace];
            var intervalBA = mPiecePitchClasses[2][mPieceCurrentPlace] - mPiecePitchClasses[0][mPieceCurrentPlace];
            var intervalBS = mPiecePitchClasses[3][mPieceCurrentPlace] - mPiecePitchClasses[0][mPieceCurrentPlace];
            var intervalTA = mPiecePitchClasses[2][mPieceCurrentPlace] - mPiecePitchClasses[1][mPieceCurrentPlace];
            var intervalTS = mPiecePitchClasses[3][mPieceCurrentPlace] - mPiecePitchClasses[2][mPieceCurrentPlace];
            var intervalAS = mPiecePitchClasses[3][mPieceCurrentPlace] - mPiecePitchClasses[2][mPieceCurrentPlace];

            // Lines.
            mLineBT.geometry.vertices[0] = mHarmonyModelGeometry.vertices[0];
            mLineBT.geometry.vertices[1] = mHarmonyModelGeometry.vertices[1];
            mLineBT.material = intervalIsConsonant(intervalBT, true) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineBA.geometry.vertices[0] = mHarmonyModelGeometry.vertices[0];
            mLineBA.geometry.vertices[1] = mHarmonyModelGeometry.vertices[2];
            mLineBA.material = intervalIsConsonant(intervalBA, true) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineBS.geometry.vertices[0] = mHarmonyModelGeometry.vertices[0];
            mLineBS.geometry.vertices[1] = mHarmonyModelGeometry.vertices[3];
            mLineBS.material = intervalIsConsonant(intervalBS, true) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineTA.geometry.vertices[0] = mHarmonyModelGeometry.vertices[1];
            mLineTA.geometry.vertices[1] = mHarmonyModelGeometry.vertices[2];
            mLineTA.material = intervalIsConsonant(intervalTA, false) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineTS.geometry.vertices[0] = mHarmonyModelGeometry.vertices[1];
            mLineTS.geometry.vertices[1] = mHarmonyModelGeometry.vertices[3];
            mLineTS.material = intervalIsConsonant(intervalTS, false) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineAS.geometry.vertices[0] = mHarmonyModelGeometry.vertices[2];
            mLineAS.geometry.vertices[1] = mHarmonyModelGeometry.vertices[3];
            mLineAS.material = intervalIsConsonant(intervalAS, false) ? mConsonanceMaterial : mDissonanceMaterial;
            mLineBT.geometry.verticesNeedUpdate = true;
            mLineBA.geometry.verticesNeedUpdate = true;
            mLineBS.geometry.verticesNeedUpdate = true;
            mLineTA.geometry.verticesNeedUpdate = true;
            mLineTS.geometry.verticesNeedUpdate = true;
            mLineAS.geometry.verticesNeedUpdate = true;
        };

        /**
         * Return true iff interval is consonant.
         */
        var intervalIsConsonant = function(aInterval, aAgainstBass)
        {
            var intervalMod12 = aInterval % 12;
            while(intervalMod12 < 0)
            {
                intervalMod12 += 12;
            }
            return intervalMod12 == 0
                   || intervalMod12 == 3
                   || intervalMod12 == 4
                   || (intervalMod12 == 5 && !aAgainstBass)
                   || intervalMod12 == 7
                   || intervalMod12 == 8
                   || intervalMod12 == 9;
        }

        /**
         * Sets a voice to a pitch class.
         */
        var setVoicePitchClass = function(aVoice, aPitchClass)
        {
            var pitchClass = aPitchClass % 12;
            if(mVoiceRingArray[aVoice].activePitchClass !== null)
            {
                mVoiceRingArray[aVoice].activePitchClass.material = mSphereMaterialSilent;

                // Make sure C is highlighted.
                if(aPitchClass != 0)
                {
                    mVoiceRingArray[aVoice].pitchClasses[0].material = mSphereMaterialPC0;
                }
            }
            mVoiceRingArray[aVoice].activePitchClass = mVoiceRingArray[aVoice].pitchClasses[pitchClass];
            mVoiceRingArray[aVoice].activePitchClass.material = mSphereMaterialSinging;
        };

        /**
         * Moves the camera based on input.
         */
        var moveCamera = function(aTimeDelta)
        {
            var displacement = mSettings.camera.speed * RADIAN * aTimeDelta / 1000;
            var zenith = mCameraZenith + (mStateCameraMove & STATE_CAMERA_MOVE.UP ? displacement : 0);
            zenith -= (mStateCameraMove & STATE_CAMERA_MOVE.DOWN ? displacement : 0);
            var azimuth = mCameraAzimuth + (mStateCameraMove & STATE_CAMERA_MOVE.RIGHT ? displacement : 0);
            azimuth -= (mStateCameraMove & STATE_CAMERA_MOVE.LEFT ? displacement : 0);
            var distance = mCameraDistance;
            setCameraPosition(zenith, azimuth, distance);
            mCamera.lookAt(CENTER);
        };

        /**
         * Sets camera position.
         */
        var setCameraPosition = function(aZenith, aAzimuth, aDistance)
        {
            mCameraAzimuth = aAzimuth;
            mCameraZenith = aZenith;
            mCameraDistance = aDistance;
            var zenithSineByDistance = Math.sin(aZenith) * aDistance;
            var mPositionX = zenithSineByDistance * Math.sin(aAzimuth);
            var mPositionY = aDistance * Math.cos(aZenith);
            var mPositionZ = zenithSineByDistance * Math.cos(aAzimuth);
            mCamera.position.x = mPositionX;
            mCamera.position.y = mPositionY;
            mCamera.position.z = mPositionZ;
            mDirectionalLighting.position.set(mCamera.position.x,
                                              mCamera.position.y,
                                              mCamera.position.z).normalize();
        };

        /**
         * Gets time delta since last call.
         */
        var getTimeDelta = function()
        {
            var date = new Date();
            var currentTime = date.getTime();
            if(mLastTime === 0)
            {
                mLastTime = currentTime;
            }
            var timeDelta = currentTime - mLastTime;
            mLastTime = currentTime;
            return timeDelta;
        };

        /**
         * The three.js render call.
         */
        var render = function()
        {
            // Handle camera movement.
            var timeDelta = getTimeDelta();
            if(mStateCameraMove !== STATE_CAMERA_MOVE.NONE)
            {
                moveCamera(timeDelta);
            }

            // Render and request next.
            mRenderer.render(mScene, mCamera);
            requestAnimationFrame(render);

        };

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PRIVATE - Initializers
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Initializes handlers.
         */
        var initializeHandlers = function()
        {
            $("body").keydown(handleEventKeydown);
            $("body").keyup(handleEventKeyup);
            $("body").keypress(handleEventKeypress);
        };

        /**
         * Initializes three.js.
         */
        var initializeThreejs = function()
        {
            mScene = new THREE.Scene();
            mCamera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
            mRenderer = new THREE.WebGLRenderer();
            mRenderer.setSize(window.innerWidth / 2, window.innerHeight );
            document.body.appendChild(mRenderer.domElement);
        }

        /**
         * Initialize camera.
         */
        var initializeCamera = function()
        {
            mStateCameraMove = STATE_CAMERA_MOVE.NONE;
            setCameraPosition(mSettings.camera.position.azimuth,
                              mSettings.camera.position.zenith,
                              mSettings.camera.position.distance);
            mCamera.lookAt(CENTER);           
        };

        /**
         * Initialize materials.
         */
        var initializeMaterials = function()
        {
            mTorusMaterial = new THREE.MeshLambertMaterial({color: 'blue', transparent: true, opacity: 0.9});
            mSphereMaterialSilent = new THREE.MeshLambertMaterial({color: mSettings.geometry.voiceRing.color.silent, 
                                                                    transparent: true, 
                                                                    opacity: 0.5});
            mSphereMaterialSinging = new THREE.MeshLambertMaterial({color: mSettings.geometry.voiceRing.color.singing, 
                                                                       transparent: true, 
                                                                       opacity: 1});
            mSphereMaterialPC0 = new THREE.MeshLambertMaterial({color: 0xffff00, 
                                                                transparent: true, 
                                                                opacity: 1});
            mHarmonyPolygonMaterial = new THREE.MeshNormalMaterial({color: 0xff0000, 
                                                                   side:THREE.DoubleSide,
                                                                   transparent: true, 
                                                                    opacity: 0.2, 
                                                                    wireframe: false});
            mConsonanceMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 5});
            mDissonanceMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 5});
        };

        /**
         * Initialize lighting.
         */
        var initializeLighting = function()
        {
            mAmbientLighting = new THREE.AmbientLight(0x333333);
            mDirectionalLighting = new THREE.DirectionalLight(0xffffff);
            mScene.add(mDirectionalLighting);
            mScene.add(mAmbientLighting);
        };

        /**
         * Initialize voice rings.
         */
        var initializeVoiceRings = function()
        {
            // Negative y offset.
            var totalHeight = mSettings.geometry.voiceRing.spacing * (mSettings.geometry.voiceRing.voices - 1);
            var yOffset = totalHeight / -2;

            mVoiceRingArray = [];
            var torusGeometry = new THREE.TorusGeometry(mSettings.geometry.voiceRing.radius, 3, 16, 100 );
            var shpereGeometry = new THREE.SphereGeometry(10, 32, 32); 
            for(var i = 0; i < mSettings.geometry.voiceRing.voices; i++)
            {
                // Create torus.
                var torus = new THREE.Mesh(torusGeometry, mTorusMaterial);
                mVoiceRingArray[i] = {ring: torus, pitchClasses: [], activePitchClass: null};
                torus.position.y += i * mSettings.geometry.voiceRing.spacing;
                torus.position.y += yOffset;
                torus.rotation.x = Math.PI / 2;
                mScene.add(torus);

                // Create pitch class spheres.
                for(var j = 0; j < 12; j++)
                {          
                    // Pitch class points.
                    var pitchClass = (j * mSettings.geometry.voiceRing.generator) % 12;
                    var sphere = new THREE.Mesh(shpereGeometry, j == 0 ? mSphereMaterialPC0 : mSphereMaterialSilent);
                    var angle = Math.PI * 2 * j / 12;
                    sphere.position.x = Math.cos(angle) * mSettings.geometry.voiceRing.radius;
                    sphere.position.y = torus.position.y;
                    sphere.position.z = Math.sin(angle) * mSettings.geometry.voiceRing.radius;
                    mVoiceRingArray[i].pitchClasses[pitchClass] = sphere;
                    mScene.add(sphere);
                }
                setVoicePitchClass(i, 0);
            }
        };

        /**
         * Initializes harmony polygon.
         */
        var initializeHarmonyPolygon = function()
        { 
            // Geometry.
            mHarmonyModelGeometry = new THREE.Geometry();
            mHarmonyModelGeometry.faces.push(new THREE.Face3(0, 1, 2));
            mHarmonyModelGeometry.faces.push(new THREE.Face3(0, 1, 3));
            mHarmonyModelGeometry.faces.push(new THREE.Face3(0, 2, 3));
            mHarmonyModelGeometry.faces.push(new THREE.Face3(1, 2, 3));
            var mesh = new THREE.Mesh(mHarmonyModelGeometry, mHarmonyPolygonMaterial);
            mScene.add(mesh);

            // Lines.
            mGeometryBT = new THREE.Geometry();
            mGeometryBT.vertices.push(new THREE.Vector3(0, 0, 0));
            mGeometryBT.vertices.push(new THREE.Vector3(0, 0, 0));
            mGeometryBA = mGeometryBT.clone();
            mGeometryBS = mGeometryBT.clone();
            mGeometryTA = mGeometryBT.clone();
            mGeometryTS = mGeometryBT.clone();
            mGeometryAS = mGeometryBT.clone();
            mLineBT = new THREE.Line(mGeometryBT, mConsonanceMaterial);
            mLineBA = new THREE.Line(mGeometryBA, mConsonanceMaterial);
            mLineBS = new THREE.Line(mGeometryBS, mConsonanceMaterial);
            mLineTA = new THREE.Line(mGeometryTA, mConsonanceMaterial);
            mLineTS = new THREE.Line(mGeometryTS, mConsonanceMaterial);
            mLineAS = new THREE.Line(mGeometryAS, mConsonanceMaterial);
            mScene.add(mLineBT);
            mScene.add(mLineBA);
            mScene.add(mLineBS);
            mScene.add(mLineTA);
            mScene.add(mLineTS);
            mScene.add(mLineAS);
        };

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PRIVATE - Event Handlers
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Keydown handler.
         */
        var handleEventKeydown = function(aEvent)
        {
            // Check for move input/output.
            if(aEvent.keyCode >= 37 && aEvent.keyCode <= 40)
            {
                aEvent.preventDefault();
                mStateCameraMove = mStateCameraMove | (aEvent.keyCode === 37 ? STATE_CAMERA_MOVE.LEFT : 0);
                mStateCameraMove = mStateCameraMove | (aEvent.keyCode === 38 ? STATE_CAMERA_MOVE.UP : 0);
                mStateCameraMove = mStateCameraMove | (aEvent.keyCode === 39 ? STATE_CAMERA_MOVE.RIGHT : 0);
                mStateCameraMove = mStateCameraMove | (aEvent.keyCode === 40 ? STATE_CAMERA_MOVE.DOWN : 0);
            }
        };

        /**
         * Keyup handler.
         */
        var handleEventKeyup = function(aEvent)
        {
            // Check for move input/output.
            if(aEvent.keyCode >= 37 && aEvent.keyCode <= 40)
            {
                aEvent.preventDefault();
                mStateCameraMove = mStateCameraMove & (aEvent.keyCode === 37 ? ~STATE_CAMERA_MOVE.LEFT : ~0);
                mStateCameraMove = mStateCameraMove & (aEvent.keyCode === 38 ? ~STATE_CAMERA_MOVE.UP : ~0);
                mStateCameraMove = mStateCameraMove & (aEvent.keyCode === 39 ? ~STATE_CAMERA_MOVE.RIGHT : ~0);
                mStateCameraMove = mStateCameraMove & (aEvent.keyCode === 40 ? ~STATE_CAMERA_MOVE.DOWN : ~0);
            }
        };

        /**
         * Keypress handler.
         */
        var handleEventKeypress = function(aEvent)
        {
            if(aEvent.keyCode == 110)
            {
                aEvent.preventDefault();
                mPieceCurrentPlace += mPieceCurrentPlace + 1 <= mPiecePitchClasses[0].length -1 ? 1 : 0;
                setHarmonyModel();
            }
            else if(aEvent.keyCode == 112)
            {
                aEvent.preventDefault();
                mPieceCurrentPlace -= mPieceCurrentPlace - 1 >= 0 ? 1 : 0;
                setHarmonyModel();
            }
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // CONSTANTS
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Camera positioning states.
        var STATE_CAMERA_MOVE = {
            NONE: 0,
            UP: 1,
            DOWN: 2,
            LEFT: 4,
            RIGHT: 8
        }

        var RADIAN = 0.01745329251;
        var CENTER = new THREE.Vector3(0, 0, 0);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PRIVATE MEMBERS
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Settings.
        var SETTINGS_DEFAULT = 
        {
            geometry:
            {
                voiceRing:
                {
                    generator: aGenerator,
                    voices: 4,
                    spacing: 70,
                    radius: 120,
                    color:
                    {
                        silent: 'white',
                        singing: 'red'
                    }
                }
            },

            camera:
            {
                position:
                {
                    azimuth: Math.PI / 2,
                    zenith: 0,
                    distance: 300
                },

                speed: 30 // radians/sec
            }
        };
        var mSettings = $.extend({}, SETTINGS_DEFAULT);

        // three.js.
        var mRenderer = null;
        var mScene = null;
        var mAmbientLighting = null;
        var mDirectionalLighting = null;
        var mSphereMaterialSilent = null;
        var mSphereMaterialSinging = null;
        var mSphereMaterialPC0 = null;
        var mTorusMaterial = null;
        var mHarmonyPolygonMaterial = null;
        var mHarmonyModelGeometry = null;
        var mConsonanceMaterial = null;
        var mDissonanceMaterial = null;
        var mGeometryBT = null;
        var mGeometryBA = null;
        var mGeometryBS = null;
        var mGeometryTA = null;
        var mGeometryTS = null;
        var mGeometryAS = null;
        var mLineBT = null;
        var mLineBA = null;
        var mLineBS = null;
        var mLineTA = null;
        var mLineTS = null;
        var mLineAS = null;

        // Geometry members.
        var mVoiceRingArray = null;

        // Camera.
        var mCamera = null;
        var mCameraAzimuth = 0;
        var mCameraZenith = 0;
        var mCameraDistance = 0;
        var mStateCameraMove = STATE_CAMERA_MOVE.NONE;
        var mLastTime = 0;

        // Music (note: measures are 0 indexed).
        var mPieceComposer = aComposer;
        var mPieceName = aPieceName;
        var mPiecePitches = aVoicePitches;
        var mPieceCurrentPlace = null;
        var mPitchClasses = null;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // STARTER
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        start();
    };

    $.fn.Tonal3DModeller = function(aComposer, aPieceName, aVoicePitches, aGenerator)
    {
        var test = new Tonal3DModeller(aComposer, aPieceName, aVoicePitches, aGenerator);
    };
})(jQuery);