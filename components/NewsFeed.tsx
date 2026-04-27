
import React, { useState, useEffect } from 'react';
import { Post, UserProfile, League } from '../types';
import * as leagueService from '../services/leagueService';
import * as youtubeService from '../services/youtubeService';

interface NewsFeedProps {
    league: League;
    user: UserProfile;
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => (
    <div className="bg-[#242526] rounded-2xl border border-white/5 overflow-hidden animate-fade-in-up shadow-xl mb-5">
        {/* Header do Post */}
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={post.user_photo || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt={post.user_name} referrerPolicy="no-referrer" />
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#e4e6eb] text-sm hover:underline cursor-pointer">{post.user_name}</h4>
                        {post.is_official && (
                            <span className="bg-[#1877F2]/10 text-[#1877F2] text-[8px] px-2 py-0.5 rounded-full font-black border border-[#1877F2]/20 uppercase">Oficial</span>
                        )}
                    </div>
                    <p className="text-[11px] text-[#b0b3b8] font-medium">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')} às {new Date(post.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
            <button className="text-[#b0b3b8] hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
        </div>
        
        {/* Conteúdo Texto */}
        <div className="px-4 pb-4">
            <p className="text-[#e4e6eb] text-[15px] leading-relaxed whitespace-pre-wrap font-normal">{post.content}</p>
        </div>

        {/* Conteúdo Mídia */}
        {post.media_url && (
            <div className="bg-black relative overflow-hidden border-y border-white/5">
                {post.media_type === 'image' ? (
                    <img src={post.media_url} className="max-h-[600px] w-full object-contain mx-auto" alt="Conteúdo" referrerPolicy="no-referrer" />
                ) : (
                    <div className="aspect-video w-full">
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${post.media_url}?rel=0&modestbranding=1`} title="LigaFull TV" frameBorder="0" allowFullScreen></iframe>
                    </div>
                )}
            </div>
        )}

        {/* Botões de Ação Estilo Social */}
        <div className="px-3 py-1 flex items-center border-t border-white/5">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[#b0b3b8] hover:bg-white/5 rounded-lg transition-all font-bold text-xs uppercase tracking-tighter">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Gostei
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[#b0b3b8] hover:bg-white/5 rounded-lg transition-all font-bold text-xs uppercase tracking-tighter">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Resenhar
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[#b0b3b8] hover:bg-white/5 rounded-lg transition-all font-bold text-xs uppercase tracking-tighter">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Compartilhar
                </button>
        </div>
    </div>
);

const NewsFeed: React.FC<NewsFeedProps> = ({ league, user }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [content, setContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        loadPosts();
    }, [league.id]);

    const loadPosts = async () => {
        const data = await leagueService.fetchPosts(league.id);
        setPosts(data);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        if (e.target.files && e.target.files[0]) {
            setMediaType(type);
            setSelectedFile(e.target.files[0]);
            setFilePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !selectedFile) return;
        
        setIsPosting(true);
        setUploadProgress(10);

        try {
            let mediaUrl = '';
            if (selectedFile) {
                if (mediaType === 'image') {
                    mediaUrl = await leagueService.uploadImage(selectedFile);
                } else {
                    // ID de vídeo padrão para teste ou integração YouTube
                    mediaUrl = "dQw4w9WgXcQ"; 
                }
            }

            setUploadProgress(70);

            // Garantindo que dados nulos sejam strings vazias para evitar erro de banco
            await leagueService.createPost({
                user_id: user.id,
                user_name: user.full_name || 'Usuário LigaFull',
                user_photo: user.photo_url || '',
                league_id: league.id,
                content: content.trim(),
                media_url: mediaUrl || undefined,
                media_type: selectedFile ? mediaType : undefined,
                is_official: false
            });

            setContent('');
            setSelectedFile(null);
            setFilePreview('');
            setUploadProgress(100);
            await loadPosts();
        } catch (error: any) {
            console.error('Falha ao postar:', error);
            alert(`Erro ao publicar post: ${error.message || 'Erro de conexão'}`);
        } finally {
            setIsPosting(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            {/* Criador de Postagem Estilo Facebook */}
            <div className="bg-[#242526] rounded-2xl p-5 border border-white/5 shadow-2xl mb-8">
                <div className="flex gap-4 mb-4">
                    <img src={user.photo_url || `https://ui-avatars.com/api/?name=${user.full_name}`} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="Avatar" referrerPolicy="no-referrer" />
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`No que você está pensando, ${user.full_name.split(' ')[0]}?`}
                        className="flex-grow bg-[#3a3b3c] border-none rounded-2xl px-5 py-3 text-white placeholder-[#b0b3b8] focus:ring-1 focus:ring-[#1877F2] resize-none h-14 min-h-[56px] text-[15px] font-medium"
                    />
                </div>

                {filePreview && (
                    <div className="relative mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black group">
                        {mediaType === 'image' ? (
                            <img src={filePreview} className="max-h-[400px] mx-auto object-contain" alt="Preview" referrerPolicy="no-referrer" />
                        ) : (
                            <video src={filePreview} className="max-h-[400px] mx-auto" controls />
                        )}
                        <button onClick={() => {setFilePreview(''); setSelectedFile(null);}} className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full transition-colors backdrop-blur-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex gap-1">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-[#b0b3b8] hover:text-[#45bd62]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#45bd62]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-xs font-bold uppercase tracking-tighter">Foto</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-[#b0b3b8] hover:text-[#f3425f]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f3425f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            <span className="text-xs font-bold uppercase tracking-tighter">Vídeo</span>
                            <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                        </label>
                    </div>
                    
                    <button 
                        onClick={handleSubmit}
                        disabled={isPosting || (!content.trim() && !selectedFile)}
                        className={`bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-[#3a3b3c] disabled:text-[#b0b3b8] text-white font-black px-10 py-2.5 rounded-xl text-sm transition-all shadow-xl flex items-center gap-2 transform active:scale-95`}
                    >
                        {isPosting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Publicando...
                            </>
                        ) : 'Publicar'}
                    </button>
                </div>
                
                {isPosting && (
                    <div className="mt-4 h-1 bg-[#3a3b3c] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1877F2] transition-all duration-500" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
            </div>

            {/* Listagem de Posts */}
            <div className="space-y-4 pb-24">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
                {posts.length === 0 && !isPosting && (
                    <div className="text-center py-24 bg-[#242526]/50 rounded-[32px] border border-dashed border-white/10">
                        <p className="text-gray-600 font-black uppercase text-xs tracking-widest italic">Nenhuma resenha por aqui ainda</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsFeed;
