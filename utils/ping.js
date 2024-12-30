import Promise from "../../PromiseV2";
import Async from "../../Async";
import packetChat from "../events/packetChat";

const OldServerPinger = Java.type("net.minecraft.client.network.OldServerPinger");
const C16PacketClientStatus = Java.type("net.minecraft.network.play.client.C16PacketClientStatus");
const S37PacketStatistics = Java.type("net.minecraft.network.play.server.S37PacketStatistics");

const oldServerPinger = new OldServerPinger();
let pingServerList = -1;

export function getPing(timeout = 5000) {
	const id = "saping:" + Math.random().toFixed(8).substring(2);
	const initial = new Date().getTime();
	let done = false;

	ChatLib.command(id);

	return new Promise((resolve, reject) => {
		const listener = (message, _, event) => {
			if (message !== "Unknown command. Type \"/help\" for help. ('" + id + "')" && message !== "Unknown command. Type \"help\" for help. ('" + id + "')") return;
			packetChat.removeListener(listener);
			resolve(new Date().getTime() - initial);
			done = true;
			cancel(event);
		};
		packetChat.addListener(listener);

		setTimeout(() => {
			if (!done) {
				packetChat.removeListener(listener);
				reject();
				done = true;
			}
		}, timeout);
	});
}

export function getPingServerList() { // need to make this return up-to-date ping at some point, not a major issue since server list ping is pretty consistent
	const serverData = Client.getMinecraft().func_147104_D();
	if (!serverData) return;
	Async.run(() => {
		oldServerPinger.func_147224_a(serverData);
	});
	return pingServerList = serverData.field_78844_e === -1 ? pingServerList : serverData.field_78844_e;
}

export function getPingInGame(timeout = 5000) {
	const initial = new Date().getTime();
	let done = false;

	Client.sendPacket(new C16PacketClientStatus(C16PacketClientStatus.EnumState.REQUEST_STATS));

	return new Promise((resolve, reject) => {
		const trigger = register("packetReceived", () => {
			trigger.unregister();
			resolve(new Date().getTime() - initial);
			done = true;
		}).setFilteredClass(S37PacketStatistics);

		setTimeout(() => {
			if (!done) {
				trigger.unregister();
				reject();
				done = true;
			}
		}, timeout);
	});
}

export default { getPing, getPingInGame, getPingServerList };
