import Settings from "../../config";
import packetOpenWindow from "../../events/packetOpenWindow";

function listener(title) {
	if (title !== "Click the button on time!") return;
	ChatLib.command("party chat " + Settings.melodyAlertMessage);
}

export function enable() {
	packetOpenWindow.addListener(listener);
}

export function disable() {
	packetOpenWindow.removeListener(listener);
}

export default { enable, disable };
