
/**
 * YouTube Direct Upload Service
 * Responsável por enviar vídeos diretamente para o canal.
 */

// NOTA: Em produção, estas chaves devem estar protegidas.
const CLIENT_ID = 'SUA_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload';

export interface UploadStatus {
    progress: number;
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
    videoId?: string;
}

export const initGapi = () => {
    return new Promise((resolve) => {
        (window as any).gapi.load('client', async () => {
            await (window as any).gapi.client.init({
                clientId: CLIENT_ID,
                scope: SCOPES,
            });
            resolve(true);
        });
    });
};

export const uploadDirectToYoutube = async (
    file: File, 
    metadata: { title: string, description: string },
    onProgress: (p: number) => void
): Promise<string> => {
    // 1. Verificar Token
    const tokenResponse = (window as any).gapi.auth.getToken();
    if (!tokenResponse) {
        throw new Error('AUTH_REQUIRED');
    }

    // 2. Realizar o Upload via Resumable Upload (Manual fetch para maior controle de progresso)
    const metadataBlob = new Blob([JSON.stringify({
        snippet: {
            title: metadata.title,
            description: metadata.description,
            categoryId: '17', // Sports
            tags: ['LigaFull', 'Gols', 'FutebolAmador']
        },
        status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false
        }
    })], { type: 'application/json' });

    const formData = new FormData();
    formData.append('metadata', metadataBlob);
    formData.append('file', file);

    // Simulando o processo de upload via XHR para pegar progresso real
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status');
        xhr.setRequestHeader('Authorization', `Bearer ${tokenResponse.access_token}`);
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.id);
            } else {
                reject(new Error('Falha no upload do YouTube'));
            }
        };

        xhr.onerror = () => reject(new Error('Erro de conexão'));
        xhr.send(formData);
    });
};
