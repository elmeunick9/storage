// From https://www.npmjs.com/package/path-browserify
// Transpiled with GPT 3.5

export function join(...paths: string[]): string {
    if (paths.length === 0) return '.';

    // Check if the first argument includes a protocol
    let prefix = '';
    if (paths[0].match(/^([a-z]+:)?\/\//i)) {
        const parts = paths[0].split('://');
        prefix = parts.shift()! + '://'; // Extract the protocol and reattach later
        paths[0] = parts.join('://'); // Update the first argument without the protocol
    }

    let joined: string | undefined;
    for (let i = 0; i < paths.length; ++i) {
        const arg = paths[i];
        if (typeof arg !== 'string') {
            throw new TypeError('Path must be a string. Received ' + JSON.stringify(arg));
        }
        if (arg.length > 0) {
            if (joined === undefined)
                joined = arg;
            else
                joined += '/' + arg;
        }
    }
    if (joined === undefined)
        return prefix + '.'; // Attach the prefix before returning the result
    return prefix + normalize(joined); // Attach the prefix before returning the result
}


export function normalize(path: string): string {
    path = path.replace(/\\+/g, '/').replace(/\/{2,}/g, '/');
    if (path.length === 0) return '.';

    const isAbsolute = path.charCodeAt(0) === 47 /*'/'*/;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*'/'*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
}

function normalizeStringPosix(path: string, allowAboveRoot: boolean): string {
    let res = '';
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;

    for (let i = 0; i <= path.length; ++i) {
        if (i < path.length)
            code = path.charCodeAt(i);
        else if (code === 47 /*'/'*/)
            break;
        else
            code = 47 /*'/'*/;

        if (code === 47 /*'/'*/) {
            if (lastSlash === i - 1 || dots === 1) {
                // NOOP
            } else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*'.'*/ || res.charCodeAt(res.length - 2) !== 46 /*'.'*/) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf('/');
                        if (lastSlashIndex !== res.length - 1) {
                            if (lastSlashIndex === -1) {
                                res = '';
                                lastSegmentLength = 0;
                            } else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    } else if (res.length === 2 || res.length === 1) {
                        res = '';
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0)
                        res += '/..';
                    else
                        res = '..';
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0)
                    res += '/' + path.slice(lastSlash + 1, i);
                else
                    res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 /*'.'*/ && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }

    return res;
}