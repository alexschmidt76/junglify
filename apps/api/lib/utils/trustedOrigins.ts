export default function getTrustedOrigins(): string[] {
    const envVarNames = ['CHROME_EXTENSION_URL', 'FIREFOX_EXTENSION_URL', 'JUNGLIFY_WEBSITE_URL'];
    
    const origins: string[] = [];

    for (const varName of envVarNames) {
        if (process.env[varName]) origins.push(process.env[varName]);
    }

    if (process.env.NODE_ENV === 'DEVELOPMENT') origins.push('http://localhost:4321');

    return origins;
}