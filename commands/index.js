import Settings from "../config";
import "./sa";
import fps from "../commands/fps";
import ping from "../commands/ping";
import tps from "../commands/tps";

const commands = { fps, ping, tps }; // only global commands are toggled

let commandState = false;

export function update() {
	if (Settings.enabled) {
		if (commandState) return;
		Object.values(commands).forEach(command => command.register());
	} else {
		if (!commandState) return;
		Object.values(commands).forEach(command => command.unregister());
	}
	commandState = Settings.enabled;
}

export default { commands, update };
