// generate-component.js
const fs = require("fs");
const path = require("path");

const name = process.argv[2];
if (!name) {
  console.error("❌ Please provide a component name.");
  process.exit(1);
}

const componentDir = path.join(__dirname, "src", "components", name);
const componentFile = path.join(componentDir, `${name}.tsx`);
const styleFile = path.join(componentDir, `${name}.module.css`);

const content = `import styles from './${name}.module.css';

interface ${name}Props {}

const ${name}: React.FC<${name}Props> = () => {
  return (
    <div className={styles.container}>
      ${name} component
    </div>
  );
};

export default ${name};
`;

const cssContent = `.container {
  /* Add styles here */
}
`;

fs.mkdirSync(componentDir, { recursive: true });
fs.writeFileSync(componentFile, content);
fs.writeFileSync(styleFile, cssContent);

console.log(`✅ Created component: ${name}`);
