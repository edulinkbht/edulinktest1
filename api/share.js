
export default async function handler(req, res) {
    const { username, postNum } = req.query;

    if (!username || !postNum) {
        return res.redirect('/feed');
    }

    try {
        // 1. Resolve username to UID
        const usersResp = await fetch(`https://firestore.googleapis.com/v1/projects/edulinki/databases/(default)/documents/users`);
        const usersData = await usersResp.json();
        const userDoc = usersData.documents?.find(d => {
            const fields = d.fields;
            return fields.username?.stringValue?.toLowerCase() === username.toLowerCase();
        });

        if (!userDoc) {
            return res.redirect('/feed');
        }

        const uid = userDoc.name.split('/').pop();
        const name = userDoc.fields.name?.stringValue || username;
        const avatar = userDoc.fields.avatar?.stringValue || "https://i.imghippo.com/files/vgr8207c.png";

        // 2. Fetch all posts of this user to find the Nth post
        const postsResp = await fetch(`https://firestore.googleapis.com/v1/projects/edulinki/databases/(default)/documents/posts?mask.fieldPaths=authorId&mask.fieldPaths=content&mask.fieldPaths=media&mask.fieldPaths=timestamp`);
        const postsData = await postsResp.json();

        let allPosts = postsData.documents?.map(d => ({
            id: d.name.split('/').pop(),
            authorId: d.fields.authorId?.stringValue,
            content: d.fields.content?.stringValue,
            media: d.fields.media?.arrayValue?.values?.map(v => v.stringValue) || (d.fields.media?.stringValue ? [d.fields.media.stringValue] : []),
            timestamp: d.fields.timestamp?.timestampValue || d.fields.timestamp?.stringValue
        })) || [];

        const userPosts = allPosts.filter(p => p.authorId === uid).sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        const post = userPosts[parseInt(postNum) - 1];

        if (!post) {
            return res.redirect(`/profile/${username}`);
        }

        // 3. Construct OG Tags
        const title = `Post by ${name} (@${username})`;
        const description = (post.content || "").substring(0, 150) + (post.content?.length > 150 ? "..." : "");
        const mediaImg = post.media && post.media.length > 0 ? post.media[0] : null;
        const image = (mediaImg && !mediaImg.includes('.mp4')) ? mediaImg : avatar;

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://edulinkbht.vercel.app/${username}/post/${postNum}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://edulinkbht.vercel.app/${username}/post/${postNum}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">

    <meta http-equiv="refresh" content="0; url=/${username}/post/${postNum}">
</head>
<body>
    <p>Redirecting to EduLink...</p>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error("Share error:", error);
        return res.redirect('/feed');
    }
}
