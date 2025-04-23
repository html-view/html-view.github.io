// SPDX-FileCopyrightText: 2012 - 2021 Jerzy Głowacki <jerzyglowacki@gmail.com>
// SPDX-FileCopyrightText: 2024 Manus AI <info@manus.ai>
// SPDX-License-Identifier: Apache-2.0

(function () {
    // Create enums for supported git forges and hosts
    const createEnum = function (variants) {
        const enumObject = {};
        for (const vari of variants) {
            enumObject[vari] = Symbol(vari);
        }
        return Object.freeze(enumObject);
    };

    const FORGE_SOFTWARES = createEnum([
        'GitHub',
        'BitBucket',
        'GitLab',
        'ForgeJo',
        'SourceHut'
    ]);

    const FORGE_HOSTS = createEnum([
        'GitHub_com',
        'BitBucket_org',
        'GitLab_com',
        'Allmende_io',
        'GitLab_OpenSourceEcology_de',
        'CodeBerg_org',
        'Git_Sr_Ht'
    ]);

    // Regular expressions for path extraction
    const RE_GITLAB_PATH = /^\/([^\/]+)\/([^\/]+)\/(-\/)?blob\/([^\/]+)\/(.+)$/;
    const RE_SOURCEHUT_PATH = /^\/~([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)$/;

    // Default parameter values
    const DEFAULT_PARAMS = {
        theme: '',
        css: '',
        inject_js: '',
        base_path: '',
        remove_scripts: false,
        width: '',
        height: '',
        scale: '1.0',
        cache: true,
        cache_time: '3600',
        sandbox: true,
        cors_proxy: 'https://api.allorigins.win/raw?url='
    };

    // Cache storage
    const previewCache = {};

    /**
     * Takes any URL to a file on a known git forge,
     * and returns the raw version of that files URL on the same forge.
     * If it already is the raw version,
     * this function just returns it as is.
     * @param {URL} forgeFileUrl - Any URL,
     *   potentially pointing to a git hosted raw (plain-text) file
     * @returns {URL} The raw version of the (git hosted) file URL.
     *
     * NOTE: This function 1st of 2 that is git-forge specific.
     */
    const rawifyForgeUrl = function (forgeFileUrl) {
        if (forgeFileUrl === null) {
            return null;
        }

        const forge = extractForge(forgeFileUrl);
        const sw = forge[0];
        if (sw === null) {
            // do nothing
        } else if (sw === FORGE_SOFTWARES.GitHub) {
            forgeFileUrl.hostname = 'raw.githubusercontent.com';
            forgeFileUrl.pathname = forgeFileUrl.pathname.replace(
                /^\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/,
                '/$1/$2/$3/$4'
            );
        } else if (sw === FORGE_SOFTWARES.BitBucket) {
            forgeFileUrl.pathname = forgeFileUrl.pathname.replace(
                /^\/([^\/]+)\/([^\/]+)\/src\/([^\/]+)\/(.+)$/,
                '/$1/$2/raw/$3/$4'
            );
        } else if (sw === FORGE_SOFTWARES.GitLab) {
            forgeFileUrl.pathname = forgeFileUrl.pathname.replace(
                RE_GITLAB_PATH,
                '/$1/$2/-/raw/$4/$5'
            );
        } else if (sw === FORGE_SOFTWARES.ForgeJo) {
            forgeFileUrl.pathname = forgeFileUrl.pathname.replace(
                /^\/([^\/]+)\/([^\/]+)\/src\/([^\/]+)\/(.+)$/,
                '/$1/$2/raw/branch/$3/$4'
            );
        } else if (sw === FORGE_SOFTWARES.SourceHut) {
            forgeFileUrl.pathname = forgeFileUrl.pathname.replace(
                RE_SOURCEHUT_PATH,
                '/$1/blob/$2/$3/$4'
            );
        } else {
            reportError('Unsupported git-forge software: ' + sw.toString());
        }
        return forgeFileUrl;
    };

    /**
     * Takes any URL to a file on a known git forge,
     * and returns the raw version of that files URL on the same forge.
     * If it already is the raw version,
     * this function just returns it as is.
     * @param {string} previewFileUrl - Any URL,
     *   potentially pointing to a git hosted raw (plain-text) file
     * @returns {URL} The raw version of the (git hosted) file URL.
     *
     * NOTE: This function 1st of 2 that is git-forge specific.
     */
    const rawifyForgeUrlStr = function (previewFileUrl) {
        let previewFileUrlParsed;
        try {
            // Handle URLs with query parameters by preserving them
            const urlParts = previewFileUrl.split('?');
            const baseUrl = urlParts[0];
            const queryParams = urlParts.length > 1 ? '?' + urlParts.slice(1).join('?') : '';
            
            previewFileUrlParsed = new URL(previewFileUrl);
            const rawUrl = rawifyForgeUrl(previewFileUrlParsed);
            
            // If the URL is from a known forge, return the raw version
            if (extractForge(previewFileUrlParsed)[0] !== null) {
                return rawUrl.href;
            }
            
            // For other URLs (like CDN links), preserve the original URL with query parameters
            return previewFileUrl;
        } catch (err) {
            reportError('Invalid URL provided in parameter "url"');
        }
    };

    /**
     * Reports an error directly in HTML.
     * @param {string} msg - The error message to be reported to the user.
     * @returns {void}
     */
    const reportError = function (msg) {
        const errP = document.createElement('p');
        errP.innerHTML = msg;
        document.body.appendChild(errP);
        throw new SyntaxError(msg);
    };

    /**
     * If the first parameter is a URL to a file on a known git forge,
     * returns the URL to the raw version of this file
     * (vs the HTML/Web view of it).
     * @returns {string} The raw version of the (git hosted) file URL
     *   requested to be previewed.
     */
    const getRawFileUrl = function () {
        if (location.search.length === 0) {
            return null;
        }

        const params = new URLSearchParams(location.search);
        const previewFileUrl = params.get('url');
        if (previewFileUrl === null) {
            reportError('Missing required parameter "url"');
            // reportError('Please use "...?url=..." vs the old "...?..."');
        }
        return rawifyForgeUrlStr(previewFileUrl);
    };

    /**
     * Extracts the forge software and host,
     * the given a URL that points to a file on a known git forge.
     * @param {URL} url - Any URL,
     *   potentially pointing to a git hosted raw (plain-text) file
     * @returns {{ software: Symbol, host: Symbol}} `(software, host)`,
     *   or `(null, null)` if unsupported/unidentified/
     *   not a git hosted raw file.
     *
     * NOTE: This is function 2nd of 2 that is git-forge specific.
     */
    const extractForge = function (url) {
        if (url === null) {
            return [null, null];
        }

        const hostname = url.hostname.toLowerCase();
        if (hostname === 'github.com') {
            return [FORGE_SOFTWARES.GitHub, FORGE_HOSTS.GitHub_com];
        } else if (hostname === 'raw.githubusercontent.com') {
            return [FORGE_SOFTWARES.GitHub, FORGE_HOSTS.GitHub_com];
        } else if (hostname === 'bitbucket.org') {
            return [FORGE_SOFTWARES.BitBucket, FORGE_HOSTS.BitBucket_org];
        } else if (hostname === 'gitlab.com') {
            return [FORGE_SOFTWARES.GitLab, FORGE_HOSTS.GitLab_com];
        } else if (hostname === 'lab.allmende.io') {
            return [FORGE_SOFTWARES.GitLab, FORGE_HOSTS.Allmende_io];
        } else if (hostname === 'gitlab.opensourceecology.de') {
            return [FORGE_SOFTWARES.GitLab, FORGE_HOSTS.GitLab_OpenSourceEcology_de];
        } else if (hostname === 'codeberg.org') {
            return [FORGE_SOFTWARES.ForgeJo, FORGE_HOSTS.CodeBerg_org];
        } else if (hostname === 'git.sr.ht') {
            return [FORGE_SOFTWARES.SourceHut, FORGE_HOSTS.Git_Sr_Ht];
        } else {
            return [null, null];
        }
    };

    /**
     * Process all parameters from the URL
     */
    const processParameters = function() {
        try {
            // Special handling for unencoded URLs with query parameters
            let urlParam = null;
            
            // Get the raw URL parameter directly from the search string
            if (window.location.search.indexOf('url=') !== -1) {
                // Get the entire remaining part of the URL after url=
                const fullSearchString = window.location.search;
                const urlParamStart = fullSearchString.indexOf('url=') + 4;
                urlParam = decodeURIComponent(fullSearchString.substring(urlParamStart));
            }
            
            // Get all parameters using standard method as fallback
            const params = new URLSearchParams(location.search);
            const parameters = getParameters(params);
            
            // Override the URL parameter if we found it using our special handling
            if (urlParam) {
                parameters.url = urlParam;
            }
            
            // Check if we have a URL parameter
            if (!parameters.url) {
                document.body.classList.remove('preview-mode');
                document.getElementById('previewform').style.display = 'block';
                document.getElementById('preview-container').style.display = 'none';
                return;
            }
            
            // Check if we have a cached version
            const cacheKey = location.search;
            if (parameters.cache && previewCache[cacheKey]) {
                const cachedData = previewCache[cacheKey];
                if (Date.now() - cachedData.timestamp < parameters.cache_time * 1000) {
                    renderPreview(cachedData.html, parameters);
                    return;
                }
            }
            
            // Fetch the HTML content
            fetchContent(parameters.url, parameters.cors_proxy)
                .then(html => {
                    // Process the HTML content
                    const processedHtml = processHtml(html, parameters);
                    
                    // Cache the result if caching is enabled
                    if (parameters.cache) {
                        previewCache[cacheKey] = {
                            html: processedHtml,
                            timestamp: Date.now()
                        };
                    }
                    
                    // Render the preview
                    renderPreview(processedHtml, parameters);
                })
                .catch(error => {
                    reportError('Error fetching content: ' + error.message);
                });
        } catch (error) {
            reportError('Error processing parameters: ' + error.message);
        }
    };

    /**
     * Get all parameters with defaults
     */
    const getParameters = function(params) {
        const parameters = { ...DEFAULT_PARAMS };
        
        // Get the URL parameter
        parameters.url = params.get('url');
        
        // Get theme/styling parameters
        if (params.has('theme')) parameters.theme = params.get('theme');
        if (params.has('css')) parameters.css = params.get('css');
        
        // Get content modification parameters
        if (params.has('inject_js')) parameters.inject_js = params.get('inject_js');
        if (params.has('base_path')) parameters.base_path = params.get('base_path');
        if (params.has('remove_scripts')) parameters.remove_scripts = params.get('remove_scripts') === 'true';
        
        // Get display parameters
        if (params.has('width')) parameters.width = params.get('width');
        if (params.has('height')) parameters.height = params.get('height');
        if (params.has('scale')) parameters.scale = params.get('scale');
        
        // Get caching parameters
        if (params.has('cache')) parameters.cache = params.get('cache') === 'true';
        if (params.has('cache_time')) parameters.cache_time = params.get('cache_time');
        
        // Get security parameters
        if (params.has('sandbox')) parameters.sandbox = params.get('sandbox') === 'true';
        if (params.has('cors_proxy')) parameters.cors_proxy = params.get('cors_proxy');
        
        return parameters;
    };

    /**
     * Fetch content from URL using CORS proxy
     */
    const fetchContent = function(url, corsProxy) {
        const rawUrl = rawifyForgeUrlStr(url);
        const proxyUrl = corsProxy + encodeURIComponent(rawUrl);
        
        return fetch(proxyUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            });
    };

    /**
     * Process HTML content based on parameters
     */
    const processHtml = function(html, parameters) {
        let processedHtml = html;
        
        // Apply base path if specified
        if (parameters.base_path) {
            processedHtml = processedHtml.replace(/<head>/i, `<head><base href="${parameters.base_path}">`);
        }
        
        // Remove scripts if specified
        if (parameters.remove_scripts) {
            processedHtml = processedHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        
        // Apply theme if specified
        if (parameters.theme) {
            let themeStyles = '';
            if (parameters.theme === 'dark') {
                themeStyles = `
                <style>
                    body { background-color: #222; color: #eee; }
                    a { color: #4da6ff; }
                    pre, code { background-color: #333; color: #f0f0f0; }
                </style>`;
            } else if (parameters.theme === 'light') {
                themeStyles = `
                <style>
                    body { background-color: #fff; color: #333; }
                    a { color: #0366d6; }
                    pre, code { background-color: #f6f8fa; color: #24292e; }
                </style>`;
            }
            processedHtml = processedHtml.replace(/<\/head>/i, `${themeStyles}</head>`);
        }
        
        // Inject custom CSS if specified
        if (parameters.css) {
            const cssLink = `<link rel="stylesheet" href="${parameters.css}">`;
            processedHtml = processedHtml.replace(/<\/head>/i, `${cssLink}</head>`);
        }
        
        // Inject custom JavaScript if specified
        if (parameters.inject_js) {
            const jsScript = `<script src="${parameters.inject_js}"></script>`;
            processedHtml = processedHtml.replace(/<\/body>/i, `${jsScript}</body>`);
        }
        
        return processedHtml;
    };

    /**
     * Render the preview with the processed HTML
     */
    const renderPreview = function(html, parameters) {
        const container = document.getElementById('preview-container');
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Add preview-mode class to body to hide form
        document.body.classList.add('preview-mode');
        document.getElementById('previewform').style.display = 'none';
        
        // Create iframe for the preview
        const iframe = document.createElement('iframe');
        iframe.id = 'preview-frame';
        
        // Apply width and height if specified
        if (parameters.width) {
            iframe.style.width = `${parameters.width}px`;
        }
        
        if (parameters.height) {
            iframe.style.height = `${parameters.height}px`;
        }
        
        // Apply scale if specified
        if (parameters.scale && parameters.scale !== '1.0') {
            iframe.style.transform = `scale(${parameters.scale})`;
            iframe.style.transformOrigin = 'top left';
        }
        
        // Apply sandbox if specified
        if (parameters.sandbox) {
            iframe.sandbox = 'allow-same-origin allow-scripts';
        }
        
        // Modify the HTML to ensure it fills the entire viewport
        const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
        const fullscreenStyle = '<style>html, body { height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: auto !important; }</style>';
        
        // Add viewport meta and fullscreen style to the HTML content
        html = html.replace(/<head>/i, `<head>${viewportMeta}${fullscreenStyle}`);
        
        // Add the iframe to the container
        container.appendChild(iframe);
        
        // Write the HTML content to the iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
    };

    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Set the service base URL
        if (document.getElementById('service_base')) {
            document.getElementById('service_base').textContent = window.location.origin + '/?url=';
        }
        
        // Check if we have parameters
        if (window.location.search.length > 0) {
            // We have parameters, process the preview
            processParameters();
        } else {
            // No parameters, show the form
            document.body.classList.remove('preview-mode');
            document.getElementById('previewform').style.display = 'block';
            document.getElementById('preview-container').style.display = 'none';
        }
    });
    
    // Also handle direct URL access without waiting for DOMContentLoaded
    if (window.location.search.length > 0) {
        // We have parameters, process the preview immediately
        processParameters();
    }
})();
