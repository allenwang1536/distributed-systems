## AWS (EC2) Quickstart
This guide uses free tier EC2 instances to run nodes that use the distribution library.

### 0) Prereqs
- AWS account with free tier eligibility.
- AWS CLI installed and configured (`aws configure`).
- An existing SSH key pair or create one in EC2.

### 1) Create a security group
Allow SSH and your node ports (replace with the port(s) you use).
```bash
aws ec2 create-security-group \
  --group-name cs1380-sg \
  --description "CS1380 distribution nodes"

aws ec2 authorize-security-group-ingress \
  --group-name cs1380-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name cs1380-sg \
  --protocol tcp --port 9000-9010 --cidr 0.0.0.0/0
```

### 2) Launch free tier instances
Use `t2.micro` (or `t3.micro` in newer regions).
```bash
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 2 \
  --instance-type t2.micro \
  --key-name YOUR_KEY_NAME \
  --security-groups cs1380-sg
```

Grab the public IPs:
```bash
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].PublicIpAddress" \
  --output text
```

### 3) SSH and set up the repo
```bash
ssh -i ~/.ssh/YOUR_KEY.pem ubuntu@PUBLIC_IP
```

On the instance:
```bash
sudo apt-get update
sudo apt-get install -y git nodejs npm
git clone https://github.com/brown-cs1380/project.git
cd project
npm install
```

### 4) Start nodes on EC2
Use the distribution library entrypoint with a config:
```bash
node distribution.js --config '{"ip":"0.0.0.0","port":9001}'
```

Repeat on the other instance(s) with different ports.

### 5) Connect nodes from your laptop
Use the public IPs and ports in your local configs or tests.
Example for a node config:
```js
const n1 = {ip: 'PUBLIC_IP_1', port: 9001};
const n2 = {ip: 'PUBLIC_IP_2', port: 9002};
```

### 6) Cleanup (avoid charges)
Terminate instances when done:
```bash
aws ec2 terminate-instances --instance-ids i-XXXXXXXX i-YYYYYYYY
```

### Tips
- Use a narrow port range in the security group.
- Keep instances stopped when not testing.
- Prefer `t2.micro` or `t3.micro` to stay in free tier.
