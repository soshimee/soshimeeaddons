import Settings from "../../config";
import packetOpenWindow from "../../events/packetOpenWindow";
import packetSetSlot from "../../events/packetSetSlot";
import closeWindow from "../../events/closeWindow";

const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow");

let inTerminal = false;
let cwid = -1;
let clicked = false;
const slots = [];
let windowSize = 0;
const queue = [];
const solution = [];
const fullSolution = [];
let openedAt = 0;

const clickTrigger = register("guiMouseClick", (x, y, button, _0, event) => {
	cancel(event);
	if (openedAt + Settings.terminalsFirstClick > new Date().getTime()) return;

	const screenWidth = Renderer.screen.getWidth();
	const screenHeight = Renderer.screen.getHeight();

	const width = 9 * 18 * Settings.terminalsScale;
	const height = windowSize / 9 * 18 * Settings.terminalsScale;

	const globalOffsetX = Number.isNaN(parseInt(Settings.terminalsOffsetX)) ? 0 : parseInt(Settings.terminalsOffsetX);
	const globalOffsetY = Number.isNaN(parseInt(Settings.terminalsOffsetY)) ? 0 : parseInt(Settings.terminalsOffsetY);

	const offsetX = screenWidth / 2 - width / 2 + globalOffsetX * Settings.terminalsScale;
	const offsetY = screenHeight / 2 - height / 2 + globalOffsetY * Settings.terminalsScale;

	const slotX = Math.floor((x - offsetX) / (18 * Settings.terminalsScale));
	const slotY = Math.floor((y - offsetY) / (18 * Settings.terminalsScale));

	if (slotX < 0 || slotX > 8 || slotY < 0) return;

	const slot = slotX + slotY * 9;

	if (slot >= windowSize) return;

	if (solution.indexOf(slot) === 0) {
		if (Settings.terminalsHighPingMode || !clicked) predict(slot, 0);
		if (Settings.terminalsHighPingMode && clicked) {
			queue.push([slot, 0]);
		} else {
			click(slot, 0);
		}
	}
}).unregister();

const renderTrigger = register(net.minecraftforge.client.event.GuiScreenEvent.DrawScreenEvent.Pre, event => {
	cancel(event);
	const screenWidth = Renderer.screen.getWidth() / Settings.terminalsScale;
	const screenHeight = Renderer.screen.getHeight() / Settings.terminalsScale;

	const width = 9 * 18;
	const height = windowSize / 9 * 18;

	const globalOffsetX = Number.isNaN(parseInt(Settings.terminalsOffsetX)) ? 0 : parseInt(Settings.terminalsOffsetX);
	const globalOffsetY = Number.isNaN(parseInt(Settings.terminalsOffsetY)) ? 0 : parseInt(Settings.terminalsOffsetY);

	const offsetX = screenWidth / 2 - width / 2 + globalOffsetX + 1;
	const offsetY = screenHeight / 2 - height / 2 + globalOffsetY;

	const title = "§8[§bSA Terminal§8] §aNumbers";

	Tessellator.pushMatrix();
	Renderer.scale(Settings.terminalsScale);
	Renderer.drawRect(Settings.terminalsBackgroundColor.getRGB(), offsetX - 2, offsetY - 2, width + 4, height + 4);
	Renderer.scale(Settings.terminalsScale);
	Renderer.drawStringWithShadow(title, offsetX, offsetY);
	for (let i = 0; i < windowSize; ++i) {
		let index = solution.indexOf(i);
		if (index === -1) continue;
		if (index >= 3) continue;

		let currentOffsetX = i % 9 * 18 + offsetX;
		let currentOffsetY = Math.floor(i / 9) * 18 + offsetY;

		Renderer.scale(Settings.terminalsScale);
		Renderer.drawRect(Settings["terminalsNumbersColor" + (index + 1)].getRGB(), currentOffsetX, currentOffsetY, 16, 16);
	}
	if (Settings.terminalsNumbersShowNumbers) {
		for (let i = 0; i < windowSize; ++i) {
			let index = fullSolution.indexOf(i);
			if (index === -1) continue;

			let currentOffsetX = i % 9 * 18 + offsetX;
			let currentOffsetY = Math.floor(i / 9) * 18 + offsetY;

			Renderer.scale(Settings.terminalsScale);
			Renderer.drawStringWithShadow(index + 1, currentOffsetX + (16 - Renderer.getStringWidth(index + 1)) / 2, currentOffsetY + 4);
		}
	}
	Tessellator.popMatrix();
}).unregister();

function openWindowListener(title, windowId, _0, slotCount) {
	cwid = windowId;
	const numbersMatch = title.match(/^Click in order!$/);
	if (numbersMatch !== null) {
		if (!inTerminal) {
			closeWindow.addListener(closeWindowListener);
			packetSetSlot.addListener(setSlotListener);
			clickTrigger.register();
			renderTrigger.register();
		}
		if (!clicked) openedAt = new Date().getTime();
		inTerminal = true;
		clicked = false;
		while (slots.length) slots.pop();
		windowSize = slotCount;
	} else {
		inTerminal = false;
	}
}

function closeWindowListener() {
	inTerminal = false;
	while (queue.length) queue.shift();
	closeWindow.removeListener(closeWindowListener);
	packetSetSlot.removeListener(setSlotListener);
	clickTrigger.unregister();
	renderTrigger.unregister();
}

function setSlotListener(itemStack, slot) {
	if (slot < 0) return;
	if (slot >= windowSize) return;
	if (itemStack?.func_77973_b()) {
		const item = new Item(itemStack);
		slots[slot] = {
			slot,
			id: item.getID(),
			meta: item.getMetadata(),
			size: item.getStackSize(),
			name: ChatLib.removeFormatting(item.getName()),
			enchanted: item.isEnchanted()
		};
	} else {
		slots[slot] = null;
	}
	if (slots.length === windowSize) {
		solve();
		solveFull();
		if (queue.length > 0) {
			if (queue.every((queued, index) => solution.indexOf(queued[0]) === index)) {
				queue.forEach(queued => predict(queued[0], queued[1]));
				click(queue[0][0], queue[0][1]);
				queue.shift();
			} else {
				while (queue.length) queue.shift();
			}
		}
	}
}

function solve() {
	while (solution.length) solution.pop();
	const allowedSlots = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25];
	slots.filter(slot => slot && allowedSlots.includes(slot.slot) && slot.id === 160 && slot.meta === 14).sort((a, b) => a.size - b.size).map(slot => slot.slot).forEach(slot => solution.push(slot));
}

function solveFull() {
	while (fullSolution.length) fullSolution.pop();
	const allowedSlots = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25];
	slots.filter(slot => slot && allowedSlots.includes(slot.slot) && slot.id === 160).sort((a, b) => a.size - b.size).map(slot => slot.slot).forEach(slot => fullSolution.push(slot));
}

function predict(slot, button) {
	if (solution.indexOf(slot) !== 0) return;
	solution.shift();
}

function click(slot, button) {
	if (slot === undefined || button === undefined) return;
	clicked = true;
	Client.sendPacket(new C0EPacketClickWindow(cwid, slot, button, 0, null, 0));
	const initialWindowId = cwid;
	setTimeout(() => {
		if (!inTerminal || initialWindowId !== cwid) return;
		while (queue.length) queue.pop();
		solve();
		clicked = false;
	}, Settings.terminalsTimeout);
}

export function enable() {
	packetOpenWindow.addListener(openWindowListener);
}

export function disable() {
	packetOpenWindow.removeListener(openWindowListener);
}

export default { enable, disable };
