import { RPM } from "../path.js"
import { THREE } from "../../System/Globals.js";

const pluginName = "More mouse options";
const inject = RPM.Manager.Plugins.inject;

const onDownID = RPM.Manager.Plugins.getParameter(pluginName, "Mouse down event ID");
const onUpID = RPM.Manager.Plugins.getParameter(pluginName, "Mouse up event ID");
const onMoveID = RPM.Manager.Plugins.getParameter(pluginName, "Mouse move event ID");
const onWheelID = RPM.Manager.Plugins.getParameter(pluginName, "Mouse wheel event ID");

const raycaster = new THREE.Raycaster();
const va = new THREE.Vector3();
const vb = new THREE.Vector3();

function raycast(v, dist, ignore = false)
{
	RPM.Core.Game.current.variables[v] = -1;
	const intersects = raycaster.intersectObjects(RPM.Scene.Map.current.scene.children);
	var mesh = null;
	if (ignore && intersects.length > 0 && intersects[0].object === RPM.Core.Game.current.hero.mesh)
		intersects.shift();
	while (intersects.length > 0)
	{
		if (!intersects[0].object.material.map)
		{
			intersects.shift();
			continue;
		}
		const img = intersects[0].object.material.map.source.data;
		const canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		const data = ctx.getImageData(0, 0, img.width, img.height).data;
		const x = parseInt(intersects[0].uv.x * img.width);
		const y = parseInt(intersects[0].uv.y * img.height);
		if (data[(x + y * img.width) * 4 + 3] == 0)
			intersects.shift();
		else
			break;
	}
	if (intersects.length > 0 && (dist < 0 || intersects[0].distance < dist))
	{
		if (intersects[0].distance > 0)
			mesh = intersects[0].object;
		else if (intersects.length > 1)
			mesh = intersects[1].object;
	}
	if (!!mesh)
	{
		for (var i = 1; i < RPM.Scene.Map.current.maxObjectsID + 1; i++)
		{
			var exitFor = false;
			if (!RPM.Scene.Map.current.allObjects[i])
				continue;
			RPM.Core.MapObject.search(i, (result) =>
			{
				if (!!result.object.mesh && result.object.mesh === mesh)
				{
					RPM.Core.Game.current.variables[v] = i;
					exitFor = true;
				}
			}, RPM.Core.ReactionInterpreter.currentObject);
			if (exitFor)
				break;
		}
	}
}

document.addEventListener("mousedown", (e) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading && !RPM.Core.ReactionInterpreter.blockingHero)
	{
		if (e.button === 0)
			RPM.Common.Inputs.mouseLeftPressed = true;
		else if (e.button === 2)
			RPM.Common.Inputs.mouseRightPressed = true;
		const x = RPM.System.DynamicValue.createNumber(e.clientX);
		const y = RPM.System.DynamicValue.createNumber(e.clientY);
		const b = RPM.System.DynamicValue.createNumber(e.button);
		RPM.Core.Game.current.hero.receiveEvent(null, false, onDownID, [null, x, y, b], RPM.Core.Game.current.heroStates);
	}
});

document.addEventListener("mouseup", (e) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading && !RPM.Core.ReactionInterpreter.blockingHero)
	{
		if (e.button === 0)
			RPM.Common.Inputs.mouseLeftPressed = false;
		else if (e.button === 2)
			RPM.Common.Inputs.mouseRightPressed = false;
		const x = RPM.System.DynamicValue.createNumber(e.clientX);
		const y = RPM.System.DynamicValue.createNumber(e.clientY);
		const b = RPM.System.DynamicValue.createNumber(e.button);
		RPM.Core.Game.current.hero.receiveEvent(null, false, onUpID, [null, x, y, b], RPM.Core.Game.current.heroStates);
	}
});

document.addEventListener("mousemove", (e) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading && !RPM.Core.ReactionInterpreter.blockingHero)
	{
		const x = RPM.System.DynamicValue.createNumber(e.movementX);
		const y = RPM.System.DynamicValue.createNumber(e.movementY);
		RPM.Core.Game.current.hero.receiveEvent(null, false, onMoveID, [null, x, y], RPM.Core.Game.current.heroStates);
	}
});

document.addEventListener("wheel", (e) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading && !RPM.Core.ReactionInterpreter.blockingHero)
	{
		if (e.deltaY > 0) // scroll down
			RPM.Core.Game.current.hero.receiveEvent(null, false, onWheelID, [null, RPM.System.DynamicValue.createSwitch(true)], RPM.Core.Game.current.heroStates);
		else if (e.deltaY < 0) // scroll up
			RPM.Core.Game.current.hero.receiveEvent(null, false, onWheelID, [null, RPM.System.DynamicValue.createSwitch(false)], RPM.Core.Game.current.heroStates);
	}
});

RPM.Manager.Plugins.registerCommand(pluginName, "Get object under cursor", (variableID, x, y, ignoreHero) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading)
	{
		const cx =  (RPM.Common.ScreenResolution.getScreenXReverse(x) / RPM.Common.ScreenResolution.SCREEN_X) * 2 - 1;
		const cy = -(RPM.Common.ScreenResolution.getScreenYReverse(y) / RPM.Common.ScreenResolution.SCREEN_Y) * 2 + 1;
		raycaster.setFromCamera(new THREE.Vector2(cx, cy), RPM.Scene.Map.current.camera.getThreeCamera());
		raycast(variableID, -1, ignoreHero);
	}
});

RPM.Manager.Plugins.registerCommand(pluginName, "Get object screen position", (id, vx, vy) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading)
	{
		if (id === -1)
			id = RPM.Core.ReactionInterpreter.currentObject.id;
		RPM.Core.Game.current.variables[vx] = null;
		RPM.Core.Game.current.variables[vy] = null;
		RPM.Core.MapObject.search(id, (result) =>
		{
			if (!!result && !!result.object.mesh)
			{
				const v = new THREE.Vector3();
				const w = window.innerWidth;
				const h = window.innerHeight;
				const p = result.object.position;
				result.object.mesh.updateMatrixWorld();
				v.setFromMatrixPosition(result.object.mesh.matrixWorld);
				v.project(RPM.Scene.Map.current.camera.getThreeCamera());
				RPM.Core.Game.current.variables[vx] = RPM.Common.ScreenResolution.getScreenXReverse( (v.x + 1) * w / 2);
				RPM.Core.Game.current.variables[vy] = RPM.Common.ScreenResolution.getScreenYReverse(-(v.y - 1) * h / 2);
			}
		}, RPM.Core.ReactionInterpreter.currentObject);
	}
});

RPM.Manager.Plugins.registerCommand(pluginName, "Lock pointer", () =>
{
	RPM.Manager.GL.renderer.domElement.requestPointerLock();
});

RPM.Manager.Plugins.registerCommand(pluginName, "Unlock pointer", () =>
{
	document.exitPointerLock();
});

RPM.Manager.Plugins.registerCommand(pluginName, "Is pointer locked?", (variableID) =>
{
	RPM.Core.Game.current.variables[variableID] = document.pointerLockElement === RPM.Manager.GL.renderer.domElement;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Raycast", (Ax, Ay, Az, Bx, By, Bz, variableID) =>
{
	if (RPM.Manager.Stack.top instanceof RPM.Scene.Map && !RPM.Scene.Map.current.loading)
	{
		const s = RPM.Datas.Systems.SQUARE_SIZE;
		va.set((Ax + 0.5) * s, (Ay + 0.5) * s, (Az + 0.5) * s);
		vb.set((Bx + 0.5) * s, (By + 0.5) * s, (Bz + 0.5) * s);
		const dist = va.distanceTo(vb);
		vb.sub(va).normalize();
		raycaster.set(va, vb);
		raycast(variableID, dist);
	}
});