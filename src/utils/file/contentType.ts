export function getContentTypeFromExtension(_ext: string): string {
    const ext = _ext.trim().toLowerCase()
    if (["html", "htm"].includes(ext))      return "text/html"
    if (["xhtml"].includes(ext))            return "application/xhtml+xml"
    if (["txt", "md", "ini"].includes(ext)) return "text/plain"
    if (["ts", "tsx"].includes(ext))        return "application/typescript"
    if (["js", "mjs", "cjs", "jsx"].includes(ext)) return "text/javascript"
    if (["json"].includes(ext))             return "application/json"
    if (["csv"].includes(ext))              return "text/csv"
    if (["tsv"].includes(ext))              return "text/tab-separated-values"
    if (["css"].includes(ext))              return "text/css"
    if (["scss"].includes(ext))             return "text/x-scss"
    if (["sass"].includes(ext))             return "text/x-sass"
    if (["rtf"].includes(ext))              return "application/rtf"
    if (["rss"].includes(ext))              return "application/rss+xml"
    if (["atom"].includes(ext))             return "application/atom+xml"
    if (["yaml", "yml"].includes(ext))      return "application/x-yaml"
    if (["xml"].includes(ext))              return "application/xml"
    if (["ico"].includes(ext))              return "image/x-icon"
    if (["jpg", "jpeg"].includes(ext))      return "image/jpeg"
    if (["png"].includes(ext))              return "image/png"
    if (["apng"].includes(ext))             return "image/apng"
    if (["webp"].includes(ext))             return "image/webp"
    if (["gif"].includes(ext))              return "image/gif"
    if (["bmp"].includes(ext))              return "image/bmp"
    if (["svg", ].includes(ext))            return "image/svg+xml"
    if (["svgz"].includes(ext))             return "image/svg+xml"
    if (["tiff", "tif"].includes(ext))      return "image/tiff"
    if (["mp3"].includes(ext))              return "audio/mpeg"
    if (["mid", "midi"].includes(ext))      return "audio/midi"
    if (["wav", "wave"].includes(ext))      return "audio/wav"
    if (["ogg"].includes(ext))              return "audio/ogg"
    if (["aac"].includes(ext))              return "audio/aac"
    if (["flac"].includes(ext))             return "audio/flac"
    if (["m4a"].includes(ext))              return "audio/mp4"
    if (["mp4"].includes(ext))              return "video/mp4"
    if (["webm"].includes(ext))             return "video/webm"
    if (["avi"].includes(ext))              return "video/x-msvideo"
    if (["ogv"].includes(ext))              return "video/ogg"
    if (["mkv"].includes(ext))              return "video/x-matroska"
    if (["ttf"].includes(ext))              return "application/x-font-ttf"
    if (["otf"].includes(ext))              return "application/x-font-opentype"
    if (["woff"].includes(ext))             return "application/font-woff"
    if (["woff2"].includes(ext))            return "application/font-woff2"
    if (["sfnt"].includes(ext))             return "application/font-sfnt"
    if (["pdf"].includes(ext))              return "application/pdf"
    if (["epub"].includes(ext))             return "application/epub+zip"
    if (["doc", "docx"].includes(ext))      return "application/msword"
    if (["xls", "xlsx"].includes(ext))      return "application/vnd.ms-excel"
    if (["ppt", "pptx"].includes(ext))      return "application/vnd.ms-powerpoint"
    if (["zip"].includes(ext))              return "application/zip"
    if (["7z"].includes(ext))               return "application/x-7z-compressed"
    if (["rar"].includes(ext))              return "application/vnd.rar"
    if (["tar"].includes(ext))              return "application/x-tar"
    if (["gz"].includes(ext))               return "application/gzip"
    if (["bz2"].includes(ext))              return "application/x-bzip2"
    if (["exe"].includes(ext))              return "application/x-msdownload"
    if (["dll"].includes(ext))              return "application/x-msdownload"

    throw new Error(`Unrecognized file type: ${ext}`)
}

export function getContentTypeFromFilePath(filepath: string) {
    const ext = filepath.split(".").at(-1)
    if (!ext) throw new Error(`Unrecognized file type for: ${filepath}`)
    return getContentTypeFromExtension(ext)
}

export function isTextFile(filepath: string) {
    try {
        const contentType = getContentTypeFromFilePath(filepath)
        if (contentType.startsWith("text/"))    return true
        if (contentType.startsWith("image/"))   return false
        if (contentType.startsWith("audio/"))   return false
        if (contentType.startsWith("video/"))   return false
        if (contentType.startsWith("application/")) {
            if (contentType.startsWith("application/json"))         return true
            if (contentType.startsWith("application/xml"))          return true
            if (contentType.startsWith("application/javascript"))   return true
            if (contentType.startsWith("application/typescript"))   return true
            if (contentType.startsWith("application/rft"))          return true
            if (contentType.startsWith("application/x-html"))       return true
            if (contentType.startsWith("application/x-yaml"))       return true
            if (contentType.startsWith("application/rss"))          return true
            if (contentType.startsWith("application/atom"))         return true
            return false
        }
        return false
    } catch (e) {
        return false
    }
}