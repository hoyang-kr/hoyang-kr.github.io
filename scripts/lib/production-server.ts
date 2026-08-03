import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";

import { projectRoot } from "./launch-data-files";

export type RunningProductionServer = {
  origin: string;
  process: ChildProcess;
  stop: () => Promise<void>;
};

export async function startProductionServer(): Promise<RunningProductionServer> {
  const port = await findAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const nextCli = resolve(projectRoot, "node_modules/next/dist/bin/next");
  const output: string[] = [];
  const child = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString()));

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Next.js server exited before becoming ready.\n${output.join("")}`,
      );
    }
    try {
      const response = await fetch(origin, { redirect: "manual" });
      if (response.status < 500) {
        return {
          origin,
          process: child,
          stop: () => stopChild(child),
        };
      }
    } catch {
      // The socket is not ready yet.
    }
    await delay(250);
  }

  await stopChild(child);
  throw new Error(
    `Timed out waiting for Next.js production server.\n${output.join("")}`,
  );
}

async function findAvailablePort() {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a local audit port."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolvePort(port);
      });
    });
  });
}

async function stopChild(child: ChildProcess) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise<true>((resolveExit) =>
      child.once("exit", () => resolveExit(true)),
    ),
    delay(3_000).then(() => false as const),
  ]);
  if (!exited && child.exitCode === null) child.kill("SIGKILL");
}

function delay(milliseconds: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
