import * as path from 'path';
import * as fse from 'fs-extra';

interface ProjectConfig {
    syncDirRoot?: string;
    syncDirs?: string[];
    syncFileType: string;
    syncTabWidth: number;
    syncQuotes: string,
}

export default function(projectRoot: string, key: string, value: string) {
    const createPaths = key.replace(/\.[^.]+$/, '').split('.');
    const moduleExports = 'export default';
    let projectConfig: ProjectConfig = {
        syncDirRoot: './src/locales',
        syncDirs: [],
        syncFileType: '.js',
        syncTabWidth: 2,
        syncQuotes: '\'',
    };
    getConfig(projectRoot).then(config => {
        Object.assign(projectConfig, config);
        const syncDirRoot: string  = config.syncDirRoot;
        const syncDirs: string[] = config.syncDirs;
        checkAndCreateDirs(projectRoot, syncDirRoot, syncDirs);
        if (syncDirRoot) {
            return getSyncDirs(projectRoot, syncDirRoot);
        } else if(syncDirs) {
            return Promise.resolve(syncDirs.map(dir => path.join(projectRoot, syncDirRoot, dir)));
        }
        return [];
    }).then(dirs => {
        if (dirs.length) {
            dirs.forEach(dir => {
                const file = `${path.join(dir, createPaths.join('/'))}${projectConfig.syncFileType}`;
                const exist = fse.existsSync(file);
                if (exist) {
                    const content = fse.readFileSync(file, 'utf8');
                    let hasCurlyBrace = false;
                    let result = content.replace(/([{,]?)(\s*)(}.*\s*)$/, (all, $1, $2, $3) => {
                        hasCurlyBrace = true;
                        return `${$1||','}${$2.match(/\\n/) ? $2 : '\n'}${createKeyValue(key, value, projectConfig)}${$3}`;
                    });
                    if (!hasCurlyBrace) {
                        if (content.indexOf(moduleExports) === -1) {
                            result += moduleExports;
                        }
                        result = result + ` {\n${createKeyValue(key, value, projectConfig)}};`;
                    }
                    fse.outputFileSync(file, result);
                } else {
                    fse.outputFileSync(file, `${moduleExports} {\n${createKeyValue(key, value, projectConfig)}};`);
                }
            });
        }
    });
}

function getConfig(projectRoot: string) {
    return fse.readFile(path.join(projectRoot, './.syncfile.js'))
    .then((syncfile) => {
        const jsonString = syncfile.toString().replace('export default', 'return ');
        return new Function(jsonString)();
    });
}

function getSyncDirs(projectRoot: string, syncDirRoot: string) {
    return fse.readdir(path.join(projectRoot, syncDirRoot)).then(dirs => {
        return dirs.map(dir => path.join(projectRoot, syncDirRoot, dir)).filter( dir => {
            return fse.statSync(dir).isDirectory();
        });
    });
}

function createTabWith(count: number) {
    return new Array(count + 1).join(' ');
}

/**
 * 生成键值对字符串
 * @param key
 * @param value
 * @param syncTabWidth
 * @param syncQuotes
 */
function createKeyValue(key: string, value: string, { syncTabWidth, syncQuotes }: ProjectConfig) {
    return `${createTabWith(syncTabWidth)}${syncQuotes}${key}${syncQuotes}: ${syncQuotes}${value}${syncQuotes}\n`;
}

/**
 * 创建目录
 * @param dirs
 */
function checkAndCreateDirs(projectRoot: string, syncDirRoot: string, dirs: string[]){
    if (dirs) {
        dirs.forEach(dir => {
            fse.ensureDirSync(path.join(projectRoot, syncDirRoot, dir));
        });
    }
}
