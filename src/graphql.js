import gql from 'graphql-tag';

const ME = gql`
    query me {
        user(login: "iteachonudemy") {
            name
            avatarUrl
        }
    }
`;

export default ME;
