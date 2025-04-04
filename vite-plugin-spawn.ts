import child_process from "node:child_process";

export function spawn(command: string, ...options: string[]) {
  let proc;

  return {
    name: "spawn",
    apply: "serve",
    buildStart() {
      if (!proc) {
        proc = child_process.spawn(command, options, {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true
        });
      }
    },
    buildEnd() {
      if (proc) {
        proc.kill()
        proc = null;
      }
    }
  };
}
