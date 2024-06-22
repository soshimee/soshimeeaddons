/// <reference types="../../CTAutocomplete" />

const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");

const listeners = [];

const trigger = register("packetReceived", (packet, event) => {
	if (packet.func_179841_c() === 2) return;

	const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());

	for (let listener of listeners) {
		listener(message, packet, event);
	}
}).setFilteredClass(S02PacketChat).unregister();

export function addListener(listener) {
	if (listeners.length === 0) trigger.register();
	listeners.push(listener);
}

export function removeListener(listener) {
	const index = listeners.indexOf(listener);
	if (index === -1) return false;
	listeners.splice(index, 1);
	if (listeners.length === 0) trigger.unregister();
	return true;
}

export default { addListener, removeListener };
