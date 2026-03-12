import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Tailwind,
  Img,
  Section,
  Row,
  Column,
} from '@react-email/components';

const emailTailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        app: ['Merienda', 'Roboto', 'sans-serif'],
      },
      colors: {
        brandBg: '#eff6ff',
        brandPanel: '#59CDF7',
        brandBorder: '#93c5fd',
        brandText: '#1e3a8a',
        brandButton: '#1d4ed8',
        imageBg: '#59CDF7'
      },
    },
  },
};

export const MemberInviteEmail = ({ memberName, founderName, familyName, link }
  : { memberName: string, founderName: string, familyName: string, link: string }) => (
  <Html>
    <Head />
    <Tailwind config={ emailTailwindConfig }>
      <Body className='bg-brandBg py-10 text-brandText'>
        <Container className='mx-auto rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section>
            <Row>
              <Column align='left' valign='top' style={ { width: '120px' } }>
                <Img
                  src='https://kbgfamilysocial.com/images/family-social-icon-only.png'
                  alt='Family Social'
                  width='100'
                  height='100'
                />
              </Column>
              <Column align='left' valign='middle'>
                <Text>
                  Good News, { memberName }! 😁 You have been invited to join the { familyName } family social platform by 👉{ founderName }👈.
                </Text>
                <Text>
                  What is Family Social? It is a site dedicated to helping families stay connected and share updates,
                  photos, and more in a private and secure environment.
                </Text>
                <Text>
                  We would be thrilled for you to join us and can't wait for you to experience all the wonderful features we have to offer!
                  To get started, please click the link below to set up your account and join our family community.
                </Text>
                <Text>
                  If you have any questions before registering, feel free to reach out to 👉{ founderName }👈. We are here to help!
                </Text>
              </Column>
            </Row>
          </Section>

          <Text className='m-0 mb-6 text-center text-base leading-6 text-brandText'>
            (The link is valid for <u>seven (7) days</u>.)
          </Text>
          <Text className='flex justify-center items-center m-0 text-base'>
            <Button
              href={ link }
              className='font-app inline-block rounded-md bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
            >
              Join Family Social
            </Button>
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default MemberInviteEmail;
