const fs = require('fs');
if (fs.existsSync('d:/Placement-Portal/src/AdminPages/AdminStuProfileView.module.css')) {
  const content = fs.readFileSync('d:/Placement-Portal/src/AdminPages/AdminStuProfileView.module.css', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('@media')) {
      console.log(`View ${i + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('AdminStuProfileView.module.css does not exist');
}
