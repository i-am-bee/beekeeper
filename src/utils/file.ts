import { Logger } from "beeai-framework";
import fs from "fs";
import { join, normalize, relative } from "path";

export function validatePath(parentDir: string, targetPath: string): string {
  // Normalize paths to remove any '..' or '.' segments and resolve relative paths
  const normalizedParent = normalize(parentDir);
  const normalizedTarget = normalize(join(normalizedParent, targetPath));

  // Get relative path to check if it stays within parent
  const relativePath = relative(normalizedParent, normalizedTarget);

  if (relativePath.startsWith("..") || targetPath.startsWith("/")) {
    throw new Error(
      `Path traversal attempt detected for path: "${targetPath}"`,
    );
  }

  // Return the clean relative path
  return relativePath;
}

export function ensureDirectoryExistsSafe(
  baseDirPath: string,
  dirPath: string,
  logger?: Logger,
) {
  const validDirPath = validatePath(baseDirPath, dirPath);

  try {
    if (!fs.existsSync(validDirPath)) {
      fs.mkdirSync(validDirPath, { recursive: true });
      logger?.info(`Created directory: ${dirPath}`);
    }
    return validDirPath;
  } catch (error) {
    logger?.error(`Error creating directory: ${dirPath}`);
    throw error;
  }
}
