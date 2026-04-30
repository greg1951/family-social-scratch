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
        brandPanel: '#ffffff',
        brandBorder: '#93c5fd',
        brandText: '#1e3a8a',
        brandButton: '#1d4ed8',
        imageBg: '#59CDF7'
      },
    },
  },
};

export const MemberSigninEmail = ({ memberName, founderName, familyName, link }
  : { memberName: string, founderName: string, familyName: string, link: string }) => (
  <Html>

    <Head />
    <Tailwind config={
      emailTailwindConfig
    }>

      <Body className='bg-brandBg py-10 text-brandText'>
        <Container style={ { padding: '20px' } } className='rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section>
            <Row>
              <Column align='left' valign='middle'>
                <Text className='m-0 mb-4 font-app text-base leading-7'>
                  { founderName } welcomes you to the { familyName } family, { memberName }! Here you&apos;ll find some
                  information about how to sign in and get started.
                </Text>
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='left' valign='top'>
                <Text className='m-0 font-app pt-2 text-left text-base leading-6'>
                  As shown in the login page below, there are three fields required to sign in:
                  your <i>email address</i>, the <i>password</i> you created during registration,
                  and the <i>family name</i>.
                </Text>
                <Text className='m-0 font-app pt-2 text-left text-base leading-6'>
                  Make note of your family name: <b>{ familyName }</b>. It must be entered exactly this way when you sign in,
                  including the capitalization. (The information shown below is just an example and is <u>not</u> your information.)
                </Text>
              </Column>
            </Row>
            <Row>
              <Column align='center'
                valign='top'
                style={ { width: '620px', paddingRight: '20px' } }>
                <Img src='https://kbgfamilysocial.com/images/emails/login-email-fields.jpg'
                  alt='Login Email Fields'
                  width='400'
                  height='300' />
              </Column>
            </Row>
            <Row>
              <Column align='center'
                valign='top'
                style={ { width: '620px', paddingRight: '20px' } }>
                <Text className='m-0 font-app pt-2 text-left text-base leading-6'>
                  If you are experiencing any issues signing in, like you don&apos;t know your family name, or you forgot
                  your password, there are helpful links on the login page to assist you. You can also reach out to { founderName } for help.
                </Text>
              </Column>
            </Row>
            <Row><br></br></Row>
            <Row>
              <Column align='center'
                valign='top'
                style={ { width: '620px', paddingRight: '20px' } }>
                <Img src='https://kbgfamilysocial.com/images/emails/login-need-help.jpg'
                  alt='Login Need Help'
                  width='400'
                  height='300' />
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Text className='m-0 mb-4 font-app pt-2 text-left text-base leading-6'>
              After you login go to the <b>My Account</b> page and update your profile. Then, go explore the site and all the wonderful features we have to offer! We are so
              excited to have you as part of the { familyName } family on Family Social!
            </Text>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='center'
                valign='top'
                style={ { width: '180px', paddingTop: '8px' } }>
                <Text className='m-0 text-center'>
                  <Button href="https://kbgfamilysocial.com/login"
                    className='font-app inline-block rounded-full bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
                  >
                    Family Social Login
                  </Button>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default MemberSigninEmail;
